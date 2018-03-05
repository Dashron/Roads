"use strict";

const roads = require('../../../index.js');

/**
 * Test that a request with slash fixing on a request without a trailing slash passes through unmodified
 */
exports['test kill slash doesn\'t break normal'] = function (test) {
	var method = 'GET';
	var url = '/users';
	var body = {};
	var headers = {};
	var contents = 'fooo';
	var next = function () {
		return new Promise(function (accept, reject) {
			accept(contents);
		});
	};

	roads.middleware.killSlash.call({}, method, url, body, headers, next)
	.then(function (response) {
		test.equal(response, contents);
		test.done();
	});
};

/**
 * Test that a request with slash fixing, on a request with a trailing slash is turned into a redirect response
 */
exports['test kill slash only trailing slash fixing a route'] = function (test) {
	var method = 'GET';
	var url = '/users/';
	var body = {};
	var headers = {};
	var contents = 'fooo';
	var next = function () {
		return new Promise(function (accept, reject) {
			accept(contents);
		});
	};

	roads.middleware.killSlash.call({
		// the redirection needs the Response context
		Response : roads.Response
	}, method, url, body, headers, next)
	.then(function (response) {
		test.deepEqual(response, {
			status : 302,
			body : null,
			headers : {
				'location' : '/users'
			}
		});
		test.done();
	})
	.catch(function (err) {
		console.log(err.stack);
		test.fail(err);
		test.done();
	});
};


/**
 * Test that a request with slash fixing on a request to the root endpoint isn't messed up. 
 * Technically it's a trailing slash, so I added this test to test the edge case
 */
exports['test kill slash not breaking on root'] = function (test) {
	var method = 'GET';
	var url = '/';
	var body = {};
	var headers = {};
	var contents = 'fooo';
	var next = function () {
		return new Promise(function (accept, reject) {
			accept(contents);
		});
	};

	roads.middleware.killSlash.call({}, method, url, body, headers, next)
	.then(function (response) {
		test.equal(response, contents);
		test.done();
	});
};