"use strict";

var roads = require('../index.js');
var url_module = require('url');

/**
 * Test that a request with slash fixing, but no response wrapping, on a request without a trailing slash
 * passes through unmodified
 */
exports.testStandardMiddlewareWithOnlyTrailingSlashDoesntBreakNormal = function (test) {
	var method = 'GET';
	var url = url_module.parse('/users');
	var body = {};
	var headers = {};
	var contents = 'fooo';
	var next = function () {
		return new Promise(function (accept, reject) {
			accept(contents);
		});
	};

	roads.middleware.standard({
		kill_trailing_slash : true,
		always_wrap_with_response : false
	}).call({}, method, url, body, headers, next)
	.then(function (response) {
		test.equal(response, contents);
		test.done();
	});
};

/**
 * Test that a request with slash fixing, but no response wrapping, on a request with a trailing slash
 * is turned into a redirect response
 */
exports.testStandardMiddlewareWithOnlyTrailingSlashFixingARoute = function (test) {
	var method = 'GET';
	var url = url_module.parse('/users/');
	var body = {};
	var headers = {};
	var contents = 'fooo';
	var next = function () {
		return new Promise(function (accept, reject) {
			accept(contents);
		});
	};

	roads.middleware.standard({
		kill_trailing_slash : true,
		always_wrap_with_response : false
	}).call({}, method, url, body, headers, next)
	.then(function (response) {
		test.deepEqual(response, {
			status : 302,
			body : null,
			headers : {
				'location' : '/users'
			}
		});
		test.done();
	});
};


/**
 * Test that a request with slash fixing, but no response wrapping, on a request to the root endpoint
 * isn't messed up. Technically it's a trailing slash, so I added this test to test the edge case
 */
exports.testStandardMiddlewareWithOnlyTrailingSlashNotBreakingOnRoot = function (test) {
	var method = 'GET';
	var url = url_module.parse('/');
	var body = {};
	var headers = {};
	var contents = 'fooo';
	var next = function () {
		return new Promise(function (accept, reject) {
			accept(contents);
		});
	};

	roads.middleware.standard({
		kill_trailing_slash : true,
		always_wrap_with_response : false
	}).call({}, method, url, body, headers, next)
	.then(function (response) {
		test.equal(response, contents);
		test.done();
	});
};

/**
 * Test that a request without slash fixing, but with response wrapping, on a request without a trailing slash
 */
exports.testStandardMiddlewareWithOnlyResponseWrapper = function (test) {
	var method = 'GET';
	var url = url_module.parse('/');
	var body = {};
	var headers = {};
	var contents = 'fooo';
	var next = function () {
		return new Promise(function (accept, reject) {
			accept(contents);
		});
	};

	roads.middleware.standard({
		kill_trailing_slash : false,
		always_wrap_with_response : true
	}).call({}, method, url, body, headers, next)
	.then(function (response) {
		test.deepEqual(response, {
			body : contents,
			status : 200,
			headers : {}
		});
		test.done();
	});
};

/**
 * 
 */
exports.testStandardMiddlewareWithSlashAndResponse = function (test) {
	var method = 'GET';
	var url = url_module.parse('/users/');
	var body = {};
	var headers = {};
	var contents = 'fooo';
	var next = function () {
		return new Promise(function (accept, reject) {
			accept(contents);
		});
	};

	roads.middleware.standard({
		kill_trailing_slash : true,
		always_wrap_with_response : true
	}).call({}, method, url, body, headers, next)
	.then(function (response) {
		test.deepEqual(response, {
			status : 302,
			body : null,
			headers : {
				'location' : '/users'
			}
		});
		test.done();
	});
};

/**
 * 
 */
exports.testStandardMiddlewareWithOptionsDisabled = function (test) {
	var method = 'GET';
	var url = url_module.parse('/');
	var body = {};
	var headers = {};
	var contents = 'fooo';
	var next = function () {
		return new Promise(function (accept, reject) {
			accept(contents);
		});
	};

	roads.middleware.standard({
		kill_trailing_slash : true,
		always_wrap_with_response : false
	}).call({}, method, url, body, headers, next)
	.then(function (response) {
		test.equal(response, contents);
		test.done();
	});
};