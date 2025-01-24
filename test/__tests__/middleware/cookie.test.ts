/* eslint-disable @typescript-eslint/no-explicit-any */
import { serverMiddleware, buildClientMiddleware } from '../../../src/middleware/cookieMiddleware';

import { CookieContext } from '../../../src/middleware/cookieMiddleware';
import Response from '../../../src/core/response';

import { describe, expect, test } from 'vitest';

describe('cookie tests', () => {
	test('test cookie middleware parses cookies into context', () => {
		expect.assertions(2);
		const context: Record<string, any> = {
			Response: Response
		};

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
		};

		const next: (this: CookieContext) => Promise<string> = function () {
			this.setCookie('foo', 'bar');
			return Promise.resolve('test');
		};

		// eslint-disable-next-line @typescript-eslint/no-empty-function
		expect(await serverMiddleware.call(context, 'a', 'b', 'c', {}, next.bind(context)))
			.toEqual(new Response('test', 200, {

				'Set-Cookie': ['foo=bar']
			}));
	});

	test('test that getCookies merges new and old cookies together and properly sets outgoing header', async () => {
		expect.assertions(2);
		const context = {
			Response: Response
		};

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

				'Set-Cookie': ['foo=bar']
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
		};

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
		};

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
});