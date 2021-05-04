import { Middleware } from '../../../index';
const cookie = Middleware.cookie;
import { CookieMiddleware } from '../../../middleware/cookie';
import Response from '../../../core/response';

describe('cookie tests', () => {
	test('test cookie middleware parses cookies into context', () => {
		expect.assertions(2);
		const context: {[x:string]: any} = {
			Response: Response
		};

		cookie.call(context, 'a', 'b', 'c', {
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

		const next: (this: CookieMiddleware) => Promise<string> = function () {
			this.setCookie('foo', 'bar');
			return Promise.resolve('test');
		};

		// eslint-disable-next-line @typescript-eslint/no-empty-function
		expect(cookie.call(context, 'a', 'b', 'c', {}, next.bind(context))).resolves.toEqual(new Response('test', 200, {
			'Set-Cookie': ['foo=bar']
		}));
	});

	/*test('test that getCookies merges new and old cookies together', () => {

	});*/
});