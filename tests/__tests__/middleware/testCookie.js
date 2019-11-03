"use strict";

const cookie = require('../../../src/index.js').middleware.cookie;
let Response = require('../../../src/index.js').Response;

describe('cookie tests', () => {
	test('test cookie middleware parses cookies into context', () => {
		expect.assertions(3);
		let context = {
			Response: Response
		};

		let middleware = cookie();

		expect(typeof(middleware)).toEqual('function');

		middleware.call(context, 'a', 'b', 'c', {
			cookie: 'foo=bar;abc=def'
		}, function () {

		});

		expect(context.cookies.foo).toEqual('bar');
		expect(context.cookies.abc).toEqual('def');
	});

	test('test cookie middleware can manipulate response cookies', () => {
		expect.assertions(4);
		let context = {
			Response: Response
		};

		let middleware = cookie();

		expect(typeof(middleware)).toEqual('function');

		middleware.call(context, 'a', 'b', 'c', {}, function () {

		});

		let resp = new context.Response();

		expect(typeof(resp.setCookie)).toEqual('function');
		resp.setCookie('foo', 'bar');
		resp.setCookie('abc', 'def');

		expect(typeof(resp.getCookies)).toEqual('function');
		expect(resp.getCookies()).toEqual({
			foo: {
				'value': 'bar'
			},
			abc: {
				'value': 'def'
			}
		});
	});


	/**
	 * Test that the cookie middleware successfully updates the response headers
	 */
	test('test cookie middleware successfully updates the headers', () => {
		expect.assertions(4);

		let context = {
			Response: Response
		};

		let middleware = cookie();

		expect(typeof(middleware)).toEqual('function');

		middleware.call(context, 'a', 'b', 'c', {}, function () {});

		let resp = new context.Response();

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