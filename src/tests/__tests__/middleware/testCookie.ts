import { Middleware } from '../../../index';
const cookie = Middleware.cookie;
import { CookieResponse } from '../../../middleware/cookie';
import Response from '../../../core/response';

describe('cookie tests', () => {
	test('test cookie middleware parses cookies into context', () => {
		expect.assertions(3);
		const context: {[x:string]: any} = {
			Response: Response
		};

		expect(typeof(cookie)).toEqual('function');

		cookie.call(context, 'a', 'b', 'c', {
			cookie: 'foo=bar;abc=def'
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		}, function () {});

		expect(context.cookies.foo).toEqual('bar');
		expect(context.cookies.abc).toEqual('def');
	});

	test('test cookie middleware can manipulate response cookies', () => {
		expect.assertions(4);
		const context = {
			Response: Response
		};

		expect(typeof(cookie)).toEqual('function');

		// eslint-disable-next-line @typescript-eslint/no-empty-function
		cookie.call(context, 'a', 'b', 'c', {}, function () {});

		const resp: CookieResponse = new CookieResponse('');

		expect(typeof(resp.setCookie)).toEqual('function');
		resp.setCookie('foo', 'bar');
		resp.setCookie('abc', 'def');

		expect(typeof(resp.getCookies)).toEqual('function');
		expect(resp.getCookies()).toEqual({
			foo: {
				value: 'bar'
			},
			abc: {
				value: 'def'
			}
		});
	});


	/**
	 * Test that the cookie middleware successfully updates the response headers
	 */
	test('test cookie middleware successfully updates the headers', () => {
		expect.assertions(4);

		const context: {[x: string]: any} = {
			Response: Response
		};

		expect(typeof(cookie)).toEqual('function');

		// eslint-disable-next-line @typescript-eslint/no-empty-function
		cookie.call(context, 'a', 'b', 'c', {}, function () {});

		const resp = new context.Response();

		expect(typeof(resp.setCookie)).toEqual('function');
		resp.setCookie('foo', 'bar');
		resp.setCookie('abc', 'def');

		expect(typeof(resp.getCookies)).toEqual('function');

		expect(resp.headers).toEqual({
			'Set-Cookie': [
				'foo=bar',
				'abc=def'
			]
		});
	});
});