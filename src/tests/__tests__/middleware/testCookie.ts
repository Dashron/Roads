/* eslint-disable @typescript-eslint/no-explicit-any */
import { cookieMiddleware } from '../../../index';

import { CookieContext } from '../../../middleware/cookieMiddleware';
import Response from '../../../core/response';

describe('cookie tests', () => {
	test('test cookie middleware parses cookies into context', () => {
		expect.assertions(2);
		const context: {[x:string]: any} = {
			Response: Response
		};

		cookieMiddleware.call(context, 'a', 'b', 'c', {
			cookie: 'foo=bar;abc=def'
		}, function () { return Promise.resolve('test'); });

		expect(context.getCookies().foo).toEqual('bar');
		expect(context.getCookies().abc).toEqual('def');
	});

	test('test cookie middleware will update the response headers', () => {
		expect.assertions(1);
		const context = {
			Response: Response
		};

		const next: (this: CookieContext) => Promise<string> = function () {
			this.setCookie('foo', 'bar');
			return Promise.resolve('test');
		};

		// eslint-disable-next-line @typescript-eslint/no-empty-function
		expect(cookieMiddleware.call(context, 'a', 'b', 'c', {}, next.bind(context)))
			.resolves.toEqual(new Response('test', 200, {

				'Set-Cookie': ['foo=bar']
			}));
	});

	/*test('test that getCookies merges new and old cookies together', () => {

	});*/
});