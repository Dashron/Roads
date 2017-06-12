"use strict";

const cookie = require('../../../index.js').middleware.cookie;
var Response = require('../../../index.js').Response;

/**
 * Test that the cookies are properly parsed into the request context
 */
exports['test cookie middleware parses cookies into context'] = function (test) {
	var context = {
		Response: Response
	};

	var middleware = cookie();

	test.ok(typeof(middleware) === 'function');

	middleware.call(context, 'a', 'b', 'c', {
		cookie: 'foo=bar;abc=def'
	}, function () {

	});

	test.equal(context.cookies.foo, 'bar');
	test.equal(context.cookies.abc, 'def');
	test.done();
};

/**
 * Test that the cookie middleware provides easy to use functions on the Response object
 */
exports['test cookie middleware can manipulate response cookies'] = function (test) {
	var context = {
		Response: Response
	};

	var middleware = cookie();

	test.ok(typeof(middleware) === 'function');

	middleware.call(context, 'a', 'b', 'c', {}, function () {

	});

	var resp = new context.Response();

	test.equal(typeof(resp.setCookie), 'function');
	resp.setCookie('foo', 'bar');
	resp.setCookie('abc', 'def');

	test.equal(typeof(resp.getCookies), 'function');
	test.deepEqual(resp.getCookies(), {
		foo: {
			'value': 'bar'
		},
		abc: {
			'value': 'def'
		}
	});

	test.done();
};


/**
 * Test that the cookie middleware successfully updates the response headers
 */
exports['test cookie middleware successfully updates the headers'] = function (test) {
	var context = {
		Response: Response
	};

	var middleware = cookie();

	test.ok(typeof(middleware) === 'function');

	middleware.call(context, 'a', 'b', 'c', {}, function () {});

	var resp = new context.Response();

	test.equal(typeof(resp.setCookie), 'function');
	resp.setCookie('foo', 'bar');
	resp.setCookie('abc', 'def');

	test.equal(typeof(resp.getCookies), 'function');

	test.deepEqual(resp.headers, {
		'Set-Cookie': [
			'foo=bar',
			'abc=def'
		]
	});

	test.done();
};