/* eslint-disable @typescript-eslint/no-explicit-any */
import { serverMiddleware, buildClientMiddleware } from '../../../src/middleware/cookieMiddleware.js';

import { CookieContext } from '../../../src/middleware/cookieMiddleware.js';
import Response from '../../../src/core/response.js';

import { describe, expect, test } from 'vitest';

/**
 * Helper function to ensure middleware returns a Response object
 * Throws an error if the result is not a Response object
 */
async function ensureResponse(middlewarePromise: Promise<Response | string> | Response | string): Promise<Response> {
	const result = await middlewarePromise;
	if (!(result instanceof Response)) {
		throw new Error(`Expected Response object but got: ${typeof result}`);
	}
	return result;
}

describe('cookie tests', () => {
	test('test cookie middleware parses cookies into context', () => {
		expect.assertions(2);
		const context = {
			Response: Response
		} as unknown as CookieContext;

		serverMiddleware.call(context, 'a', 'b', 'c', {
			cookie: 'foo=bar;abc=def'
		}, function () { return Promise.resolve('test'); });

		expect(context.getCookies().foo).toEqual('bar');
		expect(context.getCookies().abc).toEqual('def');
	});

	test('test cookie middleware will update the response headers', async () => {
		expect.assertions(1);
		const context = {
			Response: Response
		} as unknown as CookieContext;

		const next: (this: CookieContext) => Promise<string> = function () {
			this.setCookie('foo', 'bar');
			return Promise.resolve('test');
		};


		expect(await serverMiddleware.call(context, 'a', 'b', 'c', {}, next.bind(context)))
			.toEqual(new Response('test', 200, {

				'set-cookie': ['foo=bar']
			}));
	});

	test('test that getCookies merges new and old cookies together and properly sets outgoing header', async () => {
		expect.assertions(2);
		const context = {
			Response: Response
		} as unknown as CookieContext;

		const next: (this: CookieContext) => Promise<string> = function () {
			this.setCookie('foo', 'bar');
			expect(this.getCookies()).toEqual({
				foo: 'bar',
				abc: 'def'
			});

			return Promise.resolve('test');
		};

		expect(await serverMiddleware.call(context, 'a', 'b', 'c', {
			cookie: 'abc=def'
		}, next.bind(context)))
			.toEqual(new Response('test', 200, {

				'set-cookie': ['foo=bar']
			}));
	});

	test('test that getCookies still works with clientCookies', () => {
		expect.assertions(2);
		const context: Record<string, any> = {
			Response: Response
		};

		const testDocument = {
			cookie: 'foo=bar;abc=def'
		};

		buildClientMiddleware(testDocument as Document).call(context, 'a', 'b', 'c', {

		}, function () { return Promise.resolve('test'); });

		expect(context.getCookies().foo).toEqual('bar');
		expect(context.getCookies().abc).toEqual('def');
	});

	test('test that setCookies still works with clientCookies', async () => {
		expect.assertions(1);
		const context = {
			Response: Response
		} as unknown as CookieContext;

		const testDocument = {
			cookie: ''
		};

		const next: (this: CookieContext) => Promise<string> = function () {
			this.setCookie('foo', 'bar');
			return Promise.resolve('test');
		};

		await buildClientMiddleware(testDocument as Document).call(context, 'a', 'b', 'c', {}, next.bind(context));

		expect(testDocument.cookie).toEqual('foo=bar');
	});

	test('test that getCookies merges new and old cookies together and properly sets document', async () => {
		expect.assertions(2);
		const context = {
			Response: Response
		} as unknown as CookieContext;

		const next: (this: CookieContext) => Promise<string> = function () {
			this.setCookie('foo', 'bar');
			expect(this.getCookies()).toEqual({
				foo: 'bar',
				abc: 'def'
			});

			return Promise.resolve('test');
		};

		const testDocument = {
			cookie: 'abc=def'
		};

		await buildClientMiddleware(testDocument as Document).call(context, 'a', 'b', 'c', {
			// This is overridden by the document cookies. I think we want this? :shrug:. easy to fix in the future if not
			cookie: 'ignored=andDropped'
		}, next.bind(context));

		expect(testDocument.cookie).toEqual('foo=bar');
	});

	test('test cookie middleware handles existing string Set-Cookie header', async () => {
		expect.assertions(1);
		const context = {
			Response: Response
		} as unknown as CookieContext;

		const next: (this: CookieContext) => Promise<Response> = function () {
			this.setCookie('new', 'cookie');
			return Promise.resolve(new Response('test', 200, {
				'Set-Cookie': 'existing=value'  // String instead of array
			}));
		};

		const result = await ensureResponse(serverMiddleware.call(context, 'a', 'b', 'c', {}, next.bind(context)));

		expect(result.headers['set-cookie']).toEqual(['existing=value', 'new=cookie']);
	});

	test('test cookie middleware merges every casing of an existing set-cookie header', async () => {
		expect.assertions(1);
		const context = {
			Response: Response
		} as unknown as CookieContext;

		const next: (this: CookieContext) => Promise<Response> = function () {
			this.setCookie('new', 'cookie');
			return Promise.resolve(new Response('test', 200, {
				'set-cookie': 'lower=value',
				'Set-Cookie': ['upper=value']
			}));
		};

		const result = await ensureResponse(serverMiddleware.call(context, 'a', 'b', 'c', {}, next.bind(context)));

		expect(result.headers).toEqual({
			'set-cookie': ['lower=value', 'upper=value', 'new=cookie']
		});
	});
});