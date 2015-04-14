"use strict";

var roads = require('../index.js');
var url_module = require('url');

/**
 * Test that a request with slash fixing on a request without a trailing slash passes through unmodified
 */
exports.testKillSlashDoesntBreakNormal = function (test) {
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

	roads.middleware.killSlash.call({}, method, url, body, headers, next)
	.then(function (response) {
		test.equal(response, contents);
		test.done();
	});
};

/**
 * Test that a request with slash fixing, on a request with a trailing slash is turned into a redirect response
 */
exports.testKillSlashOnlyTrailingSlashFixingARoute = function (test) {
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

	roads.middleware.killSlash.call({}, method, url, body, headers, next)
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
 * Test that a request with slash fixing on a request to the root endpoint isn't messed up. 
 * Technically it's a trailing slash, so I added this test to test the edge case
 */
exports.testKillSlashNotBreakingOnRoot = function (test) {
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

	roads.middleware.killSlash.call({}, method, url, body, headers, next)
	.then(function (response) {
		test.equal(response, contents);
		test.done();
	});
};