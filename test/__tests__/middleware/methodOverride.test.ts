import { build, MethodOverrideOptions } from '../../../src/middleware/methodOverride.js';
import {
	build as buildCSRF, buildClientMiddleware as buildClientCSRF, CSRF_BODY_NAME, CSRF_COOKIE_NAME
} from '../../../src/middleware/csrf.js';
import { serverMiddleware as cookieMiddleware } from '../../../src/middleware/cookieMiddleware.js';
import { middleware as parseBodyMiddleware } from '../../../src/middleware/parseBody.js';
import { Router } from '../../../src/middleware/router.js';
import Road, { IncomingHeaders } from '../../../src/core/road.js';
import Response from '../../../src/core/response.js';
import { sign, verify, secondsFromNow } from '../../resources/fakeSigner.js';

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const FORM_HEADERS = { 'content-type': 'application/x-www-form-urlencoded' };

/**
 * Runs a single request through the parse body and method override middleware (with no CSRF requirement),
 * 	and resolves with the method that the middleware after it received
 */
function requestMethod (
	method: string, url: string, body?: string, headers?: IncomingHeaders, options: MethodOverrideOptions = {}
): Promise<Response> {
	const road = new Road();

	road.use(parseBodyMiddleware);
	// Stands in for the CSRF middleware, which is tested with the real thing further down
	road.use(function (requestMethod, requestUrl, requestBody, requestHeaders, next) {
		this.csrfProtected = true;
		return next();
	});
	road.use(build(options));
	road.use((finalMethod) => finalMethod);

	return road.request(method, url, body, headers);
}

describe('method override tests', () => {
	test('throws when the CSRF middleware has not run', () => {
		expect.assertions(1);

		const road = new Road();
		road.use(parseBodyMiddleware);
		road.use(build());
		road.use((method) => method);

		// This is a GET with no override, to make sure a misconfigured road fails on any request
		return expect(road.request('GET', '/')).rejects.toThrow(
			'The method override middleware requires the CSRF middleware to be added to the road first'
		);
	});

	test('works in the browser with the client CSRF middleware', async () => {
		expect.assertions(1);

		const road = new Road();
		road.use(parseBodyMiddleware);
		road.use(buildClientCSRF({ cookie: '' } as Document));
		road.use(build());
		road.use((method) => method);

		expect((await road.request('POST', '/', '_method=DELETE', FORM_HEADERS)).body).toEqual('DELETE');
	});

	test('a POST with no override stays a POST', async () => {
		expect.assertions(1);

		expect((await requestMethod('POST', '/?other=1', 'a=b', FORM_HEADERS)).body).toEqual('POST');
	});

	test('overrides from the x-http-method-override header', async () => {
		expect.assertions(1);

		expect((await requestMethod('POST', '/', undefined, { 'x-http-method-override': 'PUT' })).body).toEqual('PUT');
	});

	test('overrides from the _method body field', async () => {
		expect.assertions(1);

		expect((await requestMethod('POST', '/', '_method=DELETE', FORM_HEADERS)).body).toEqual('DELETE');
	});

	test('overrides from the _method field of a JSON body', async () => {
		expect.assertions(1);

		const response = await requestMethod('POST', '/', '{"_method":"PATCH"}', { 'content-type': 'application/json' });

		expect(response.body).toEqual('PATCH');
	});

	test('overrides from the _method query parameter', async () => {
		expect.assertions(1);

		expect((await requestMethod('POST', '/users?a=b&_method=PATCH#hash')).body).toEqual('PATCH');
	});

	test('the header wins over the body, and the body wins over the query', async () => {
		expect.assertions(2);

		expect((await requestMethod('POST', '/?_method=PATCH', '_method=DELETE', {
			...FORM_HEADERS, 'x-http-method-override': 'PUT'
		})).body).toEqual('PUT');

		expect((await requestMethod('POST', '/?_method=PATCH', '_method=DELETE', FORM_HEADERS)).body).toEqual('DELETE');
	});

	test('lower case overrides are upper-cased', async () => {
		expect.assertions(1);

		expect((await requestMethod('POST', '/?_method=delete')).body).toEqual('DELETE');
	});

	test('only the first value is used when an override is sent more than once', async () => {
		expect.assertions(3);

		expect((await requestMethod('POST', '/', undefined, {
			'x-http-method-override': ['PUT', 'DELETE']
		})).body).toEqual('PUT');
		expect((await requestMethod('POST', '/', '_method=PUT&_method=DELETE', FORM_HEADERS)).body).toEqual('PUT');
		expect((await requestMethod('POST', '/?_method=PUT&_method=DELETE')).body).toEqual('PUT');
	});

	test.each(['GET', 'HEAD', 'OPTIONS', 'POST', 'TRACE', 'PUTPUT'])(
		'an override of %s is rejected by default', async (override) => {
			expect.assertions(1);

			await expect(requestMethod('POST', `/?_method=${override}`)).resolves.toEqual(
				new Response('Invalid method override', 400)
			);
		}
	);

	test('the methods option replaces the default list', async () => {
		expect.assertions(2);

		expect((await requestMethod('POST', '/?_method=put', undefined, undefined, { methods: ['put'] })).body)
			.toEqual('PUT');
		expect((await requestMethod('POST', '/?_method=DELETE', undefined, undefined, { methods: ['put'] })).status)
			.toEqual(400);
	});

	test.each(['GET', 'PUT', 'DELETE'])('overrides are ignored on %s requests', async (method) => {
		expect.assertions(1);

		const response = await requestMethod(method, '/?_method=PATCH', '_method=PATCH', {
			...FORM_HEADERS, 'x-http-method-override': 'PATCH'
		});

		expect(response.body).toEqual(method);
	});

	describe('with the CSRF middleware and a router', () => {
		const COOKIE_NAME = CSRF_COOKIE_NAME;

		beforeEach(() => {
			// Failed validations are logged, which we don't need to see in the test output
			vi.spyOn(console, 'error').mockImplementation(() => {});
		});

		afterEach(() => {
			vi.restoreAllMocks();
		});

		function buildRoad () {
			const road = new Road();

			road.use(cookieMiddleware);
			road.use(parseBodyMiddleware);
			road.use(buildCSRF({ sign, verify }));
			road.use(build());

			const router = new Router(road);
			router.addRoute('POST', '/posts/#id', async () => new Response('created'));
			router.addRoute('DELETE', '/posts/#id', async (method, url) => new Response(`${method} ${url.args?.id}`));

			return road;
		}

		test('a form POST with _method and a valid CSRF token reaches the overridden route', async () => {
			expect.assertions(1);

			const token = sign({ exp: secondsFromNow(60) });
			const response = await buildRoad().request('POST', '/posts/12', `_method=DELETE&${CSRF_BODY_NAME}=${token}`, {
				...FORM_HEADERS, cookie: `${COOKIE_NAME}=${token}`
			});

			expect(response).toEqual(new Response('DELETE 12', 200));
		});

		test('a form POST without _method still reaches the POST route', async () => {
			expect.assertions(1);

			const token = sign({ exp: secondsFromNow(60) });
			const response = await buildRoad().request('POST', '/posts/12', `${CSRF_BODY_NAME}=${token}`, {
				...FORM_HEADERS, cookie: `${COOKIE_NAME}=${token}`
			});

			expect(response.body).toEqual('created');
		});

		test('a form POST with _method and no CSRF token is rejected', async () => {
			expect.assertions(1);

			const response = await buildRoad().request('POST', '/posts/12?_method=DELETE', '_method=DELETE', FORM_HEADERS);

			expect(response.status).toEqual(403);
		});
	});
});
