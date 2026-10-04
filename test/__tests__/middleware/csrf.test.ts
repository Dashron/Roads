import {
	build, buildClientMiddleware, CSRF_BODY_NAME, CSRF_COOKIE_NAME, CSRFContext, CSRFOptions
} from '../../../src/middleware/csrf.js';
import { serverMiddleware as cookieMiddleware, CookieContext } from '../../../src/middleware/cookieMiddleware.js';
import { middleware as parseBodyMiddleware } from '../../../src/middleware/parseBody.js';
import { middleware as storeValsMiddleware, StoreValsContext } from '../../../src/middleware/storeVals.js';
import Road, { Context, IncomingHeaders } from '../../../src/core/road.js';
import Response from '../../../src/core/response.js';
import { sign, verify, secondsFromNow } from '../../resources/fakeSigner.js';

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const COOKIE_NAME = CSRF_COOKIE_NAME;
const FORM_HEADERS = { 'content-type': 'application/x-www-form-urlencoded' };

type TestContext = CSRFContext & CookieContext & StoreValsContext & { userID?: string };

/**
 * Builds a road with everything the CSRF middleware needs, and a final middleware that runs `handler`
 */
function buildRoad (handler: (this: TestContext, method: string) => string, options: Partial<CSRFOptions> = {}) {
	const road = new Road();

	road.use(cookieMiddleware);
	road.use(storeValsMiddleware);
	road.use(parseBodyMiddleware);
	road.use(build({ sign, verify, ...options }));
	road.use<TestContext>(function (method) {
		return handler.call(this, method);
	});

	return road;
}

function post (road: Road, bodyToken?: string, cookieToken?: string, headers: IncomingHeaders = {}) {
	return road.request(
		'POST', '/',
		bodyToken === undefined ? '' : `${CSRF_BODY_NAME}=${encodeURIComponent(bodyToken)}`,
		{
			...FORM_HEADERS,
			...(cookieToken === undefined ? {} : { cookie: `${COOKIE_NAME}=${cookieToken}` }),
			...headers
		}
	);
}

describe('csrf tests', () => {
	beforeEach(() => {
		// Failed validations are logged, which we don't need to see in the test output
		vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	test('getCSRFToken creates a token and sets the cookie', async () => {
		expect.assertions(4);

		const road = buildRoad(function () {
			return this.getCSRFToken({ extra: 'data' });
		});

		const response = await road.request('GET', '/');
		const token = response.body as string;
		const payload = verify(token) as Record<string, unknown>;

		expect(payload.extra).toEqual('data');
		expect(payload.exp).toBeGreaterThan(secondsFromNow(60 * 60 * 24 - 5));
		expect(payload.exp).toBeLessThanOrEqual(secondsFromNow(60 * 60 * 24));
		expect(response.headers['set-cookie']).toEqual([
			`__Host-csrf=${encodeURIComponent(token)}; Path=/; Secure; SameSite=Strict`
		]);
	});

	test('a cookie name without the __Host- prefix is refused', () => {
		expect.assertions(1);

		expect(() => build({ sign, verify, cookieName: 'csrf' })).toThrow(
			'The CSRF cookie name must start with __Host-'
		);
	});

	test.each([
		['uses a cookie named csrf by default', undefined, 'csrf'],
		['allows any cookie name', 'my_csrf', 'my_csrf']
	])('insecureCookie removes the Secure flag and %s', async (description, cookieName, expectedName) => {
		expect.assertions(1);

		const road = buildRoad(function () {
			return this.getCSRFToken();
		}, { insecureCookie: true, ...(cookieName ? { cookieName } : {}) });

		const response = await road.request('GET', '/');

		expect(response.headers['set-cookie']).toEqual([
			`${expectedName}=${encodeURIComponent(response.body as string)}; Path=/; SameSite=Strict`
		]);
	});

	test('insecureCookie refuses a cookie name with the __Host- prefix', () => {
		expect.assertions(1);

		// Browsers drop cookies with this prefix unless they are Secure, so every form would fail
		expect(() => build({ sign, verify, cookieName: '__Host-csrf', insecureCookie: true })).toThrow(
			'The CSRF cookie name can not start with __Host- when insecureCookie is true'
		);
	});

	test('a verify function that accepts tampered tokens is refused', () => {
		expect.assertions(1);

		// This is what happens if you decode the token without checking its signature
		const acceptEverything = () => ({ exp: secondsFromNow(60) });

		expect(() => build({ sign, verify: acceptEverything })).toThrow(
			'The CSRF verify function accepted a token that was tampered with'
		);
	});

	test('a verify function that does not accept tokens from sign is refused', () => {
		expect.assertions(2);

		expect(() => build({ sign, verify: () => { throw new Error('nope'); } })).toThrow(
			'The CSRF verify function did not accept a token created by the sign function'
		);
		expect(() => build({ sign, verify: () => 'a string' })).toThrow(
			'The CSRF verify function did not accept a token created by the sign function'
		);
	});

	test('a sign function that does not return a string is refused', () => {
		expect.assertions(1);

		expect(() => build({ sign: () => '', verify })).toThrow(
			'The CSRF sign function must return a non-empty string'
		);
	});

	test('the server middleware can not be built in the browser', () => {
		expect.assertions(1);

		vi.stubGlobal('document', {});

		expect(() => build({ sign, verify })).toThrow('The CSRF middleware can not be built in the browser');
	});

	test('getCSRFToken respects the expiresIn option', async () => {
		expect.assertions(1);

		const road = buildRoad(function () {
			return this.getCSRFToken();
		}, { expiresIn: 60 });

		const response = await road.request('GET', '/');
		const payload = verify(response.body as string) as Record<string, unknown>;

		expect(payload.exp).toBeLessThanOrEqual(secondsFromNow(60));
	});

	test('getCSRFToken returns the same token when called twice in one request', async () => {
		expect.assertions(2);

		const road = buildRoad(function () {
			return JSON.stringify([this.getCSRFToken(), this.getCSRFToken()]);
		});

		const response = await road.request('GET', '/');
		const tokens = JSON.parse(response.body as string);

		expect(tokens[0]).toEqual(tokens[1]);
		expect(response.headers['set-cookie']).toHaveLength(1);
	});

	test('getCSRFToken reuses a valid cookie', async () => {
		expect.assertions(2);

		const existing = sign({ exp: secondsFromNow(60) });
		const road = buildRoad(function () {
			return this.getCSRFToken();
		});

		const response = await road.request('GET', '/', undefined, { cookie: `${COOKIE_NAME}=${existing}` });

		expect(response.body).toEqual(existing);
		expect(response.headers['set-cookie']).toBeUndefined();
	});

	test.each([
		['has a bad signature', 'not-a-real-token'],
		['has expired', sign({ exp: secondsFromNow(-60) })],
		['has no expiry', sign({})],
		['belongs to a different user', sign({ userId: 'someone-else', exp: secondsFromNow(60) })]
	])('getCSRFToken replaces a cookie that %s', async (description, existing) => {
		expect.assertions(2);

		const road = buildRoad(function () {
			return this.getCSRFToken();
		}, { getUserId: () => 'me' });

		const response = await road.request('GET', '/', undefined, { cookie: `${COOKIE_NAME}=${existing}` });

		expect(response.body).not.toEqual(existing);
		expect((verify(response.body as string) as Record<string, unknown>).userId).toEqual('me');
	});

	test('getCSRFFormElement returns a hidden input and stores it', async () => {
		expect.assertions(2);

		const existing = sign({ exp: secondsFromNow(60) });
		let stored: unknown;
		const road = buildRoad(function () {
			const element = this.getCSRFFormElement();
			stored = this.getVal('csrfElement');
			return element;
		});

		const response = await road.request('GET', '/', undefined, { cookie: `${COOKIE_NAME}=${existing}` });

		expect(response.body).toEqual(`<input type="hidden" name="csrf_token" value="${existing}">`);
		expect(stored).toEqual(response.body);
	});

	test('getCSRFFormElement escapes the token and works without the store vals middleware', async () => {
		expect.assertions(1);

		const road = new Road();
		road.use(cookieMiddleware);
		road.use(parseBodyMiddleware);
		road.use(build({
			sign: () => 'a"b<c>&d',
			verify: (token) => {
				if (token !== 'a"b<c>&d') {
					throw new Error('invalid');
				}

				return { exp: secondsFromNow(60) };
			}
		}));
		road.use<CSRFContext>(function () {
			return this.getCSRFFormElement();
		});

		const response = await road.request('GET', '/');

		expect(response.body).toEqual('<input type="hidden" name="csrf_token" value="a&quot;b&lt;c&gt;&amp;d">');
	});

	test.each(['GET', 'HEAD', 'OPTIONS'])('%s requests pass without a token', async (method) => {
		expect.assertions(1);

		const road = buildRoad(() => 'hit');

		expect((await road.request(method, '/')).body).toEqual('hit');
	});

	test.each(['POST', 'PUT', 'PATCH', 'DELETE'])('%s requests without a token are rejected', async (method) => {
		expect.assertions(1);

		const road = buildRoad(() => 'hit');

		expect((await road.request(method, '/')).status).toEqual(403);
	});

	test.each(['POST', 'PUT', 'PATCH', 'DELETE'])('%s requests with a valid token pass', async (method) => {
		expect.assertions(1);

		const token = sign({ exp: secondsFromNow(60) });
		const road = buildRoad(function (requestMethod) {
			return `${requestMethod} ${this.csrfProtected}`;
		});

		const response = await road.request(method, '/', `${CSRF_BODY_NAME}=${token}`, {
			...FORM_HEADERS, cookie: `${COOKIE_NAME}=${token}`
		});

		expect(response.body).toEqual(`${method} true`);
	});

	test('a valid token in a JSON body passes', async () => {
		expect.assertions(1);

		const token = sign({ exp: secondsFromNow(60) });
		const road = buildRoad(() => 'hit');

		const response = await road.request('POST', '/', JSON.stringify({ [CSRF_BODY_NAME]: token }), {
			'content-type': 'application/json', cookie: `${COOKIE_NAME}=${token}`
		});

		expect(response.body).toEqual('hit');
	});

	test('a valid token for the logged in user passes', async () => {
		expect.assertions(1);

		const token = sign({ userId: 'me', exp: secondsFromNow(60) });
		const road = buildRoad(() => 'hit', { getUserId: () => 'me' });

		expect((await post(road, token, token)).body).toEqual('hit');
	});

	test('getUserId receives the request context', async () => {
		expect.assertions(1);

		const token = sign({ userId: 'me', exp: secondsFromNow(60) });
		const road = new Road();

		road.use(cookieMiddleware);
		road.use(parseBodyMiddleware);
		road.use(function (method, url, body, headers, next) {
			this.userID = 'me';
			return next();
		});
		road.use(build({ sign, verify, cookieName: COOKIE_NAME, getUserId: (context: Context) => context.userID }));
		road.use(() => 'hit');

		expect((await post(road, token, token)).body).toEqual('hit');
	});

	test('a POST with no cookie is rejected', async () => {
		expect.assertions(1);

		const road = buildRoad(() => 'hit');

		expect((await post(road, sign({ exp: secondsFromNow(60) }))).status).toEqual(403);
	});

	test('a POST with a cookie but no body token is rejected', async () => {
		expect.assertions(1);

		const road = buildRoad(() => 'hit');

		expect((await post(road, undefined, sign({ exp: secondsFromNow(60) }))).status).toEqual(403);
	});

	test('a POST with two body tokens is rejected', async () => {
		expect.assertions(1);

		const token = sign({ exp: secondsFromNow(60) });
		const road = buildRoad(() => 'hit');

		const response = await road.request('POST', '/', `${CSRF_BODY_NAME}=${token}&${CSRF_BODY_NAME}=${token}`, {
			...FORM_HEADERS, cookie: `${COOKIE_NAME}=${token}`
		});

		expect(response.status).toEqual(403);
	});

	test('a POST with an unparsed body is rejected', async () => {
		expect.assertions(1);

		const token = sign({ exp: secondsFromNow(60) });
		const road = buildRoad(() => 'hit');

		const response = await road.request('POST', '/', `${CSRF_BODY_NAME}=${token}`, {
			'content-type': 'text/plain', cookie: `${COOKIE_NAME}=${token}`
		});

		expect(response.status).toEqual(403);
	});

	test('a POST where the body token is validly signed but differs from the cookie is rejected', async () => {
		expect.assertions(1);

		// This is the attack where someone gets their own logged out token and submits it for another visitor
		const attackerToken = sign({ exp: secondsFromNow(120) });
		const victimToken = sign({ exp: secondsFromNow(60) });
		const road = buildRoad(() => 'hit');

		expect((await post(road, attackerToken, victimToken)).status).toEqual(403);
	});

	test.each([
		['has a bad signature', 'not-a-real-token'],
		['has expired', sign({ userId: 'me', exp: secondsFromNow(-60) })],
		['has no expiry', sign({ userId: 'me' })],
		['belongs to a different user', sign({ userId: 'someone-else', exp: secondsFromNow(60) })],
		['was created while logged out', sign({ exp: secondsFromNow(60) })]
	])('a POST with a matching token that %s is rejected', async (description, token) => {
		expect.assertions(1);

		const road = buildRoad(() => 'hit', { getUserId: () => 'me' });

		expect((await post(road, token, token)).status).toEqual(403);
	});

	test.each([
		['sec-fetch-site is same-origin', { 'sec-fetch-site': 'same-origin' }],
		['sec-fetch-site is none', { 'sec-fetch-site': 'none' }],
		['the origin matches the host', { origin: 'https://example.com', host: 'example.com' }],
		['the origin matches the host and port', { origin: 'http://localhost:8081', host: 'localhost:8081' }],
		['the origin matches the host in a different case', { origin: 'https://example.com', host: 'Example.com' }],
		['there are no origin headers', {}]
	])('a POST with a valid token passes when %s', async (description, headers: IncomingHeaders) => {
		expect.assertions(1);

		const token = sign({ exp: secondsFromNow(60) });
		const road = buildRoad(() => 'hit');

		expect((await post(road, token, token, headers)).body).toEqual('hit');
	});

	test.each([
		['sec-fetch-site is cross-site', { 'sec-fetch-site': 'cross-site' }],
		// This is what a sibling subdomain sends
		['sec-fetch-site is same-site', { 'sec-fetch-site': 'same-site' }],
		['sec-fetch-site is same-site and the origin looks right', {
			'sec-fetch-site': 'same-site', origin: 'https://example.com', host: 'example.com'
		}],
		['the origin is another host', { origin: 'https://evil.example', host: 'example.com' }],
		['the origin is a subdomain of the host', { origin: 'https://blog.example.com', host: 'example.com' }],
		['the origin is on another port', { origin: 'http://localhost:9000', host: 'localhost:8081' }],
		['the origin is null', { origin: 'null', host: 'example.com' }],
		['there is an origin but no host', { origin: 'https://example.com' }]
	])('a POST with a valid token is rejected when %s', async (description, headers: IncomingHeaders) => {
		expect.assertions(1);

		const token = sign({ exp: secondsFromNow(60) });
		const road = buildRoad(() => 'hit');

		expect((await post(road, token, token, headers)).status).toEqual(403);
	});

	test('trustedOrigins lets another origin through, but still requires the token', async () => {
		expect.assertions(3);

		const token = sign({ exp: secondsFromNow(60) });
		const road = buildRoad(() => 'hit', { trustedOrigins: ['https://www.example.com'] });
		const trusted = { 'sec-fetch-site': 'same-site', origin: 'https://www.example.com', host: 'example.com' };

		expect((await post(road, token, token, trusted)).body).toEqual('hit');
		expect((await post(road, undefined, token, trusted)).status).toEqual(403);
		expect((await post(road, token, token, { ...trusted, origin: 'https://blog.example.com' })).status).toEqual(403);
	});

	describe('client middleware', () => {
		function buildClientRoad (cookies: string, cookieName?: string) {
			const road = new Road();

			road.use(buildClientMiddleware({ cookie: cookies } as Document, cookieName));

			return road;
		}

		test('the token and form element come from the cookie', async () => {
			expect.assertions(1);

			const road = buildClientRoad('other=1; __Host-csrf=abc%22def');
			road.use<CSRFContext>(function () {
				return JSON.stringify([this.getCSRFToken(), this.getCSRFFormElement(), this.csrfProtected]);
			});

			expect(JSON.parse((await road.request('GET', '/')).body as string)).toEqual([
				'abc"def',
				'<input type="hidden" name="csrf_token" value="abc&quot;def">',
				true
			]);
		});

		test('the cookie name can be changed', async () => {
			expect.assertions(1);

			const road = buildClientRoad('csrf=abc', 'csrf');
			road.use<CSRFContext>(function () {
				return this.getCSRFToken();
			});

			expect((await road.request('GET', '/')).body).toEqual('abc');
		});

		test('the token is empty when there is no cookie', async () => {
			expect.assertions(1);

			const road = buildClientRoad('');
			road.use<CSRFContext>(function () {
				return this.getCSRFFormElement();
			});

			expect((await road.request('GET', '/')).body).toEqual('<input type="hidden" name="csrf_token" value="">');
		});

		test('POST requests are not checked', async () => {
			expect.assertions(1);

			const road = buildClientRoad('');
			road.use(() => 'hit');

			expect((await road.request('POST', '/')).body).toEqual('hit');
		});
	});

	test('rejected requests do not reach later middleware', async () => {
		expect.assertions(2);

		let hit = false;
		const road = buildRoad(() => {
			hit = true;
			return 'hit';
		});

		const response = await road.request('POST', '/');

		expect(response).toBeInstanceOf(Response);
		expect(hit).toEqual(false);
	});

	test('the middleware throws when the cookie middleware is missing', () => {
		expect.assertions(1);

		const road = new Road();
		road.use(parseBodyMiddleware);
		road.use(build({ sign, verify, cookieName: COOKIE_NAME }));

		return expect(road.request('GET', '/')).rejects.toThrow(
			'The CSRF middleware requires the cookie middleware to be added to the road first'
		);
	});
});
