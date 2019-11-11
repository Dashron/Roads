"use strict";

const roads = require('../../../built/index.js');

describe('KillSlashes tests', () => {
	test('test kill slash doesn\'t break normal', () => {
		expect.assertions(1);

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

		return expect(roads.middleware.killSlash.call({}, method, url, body, headers, next)).resolves.toEqual(contents);
	});

/**
 * Test that a request with slash fixing, on a request with a trailing slash is turned into a redirect response
 */
	test('test kill slash only trailing slash fixing a route', () => {
		expect.assertions(1);

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

		return expect(roads.middleware.killSlash.call({
			// the redirection needs the Response context
			Response : roads.Response
		}, method, url, body, headers, next)).resolves.toEqual({
			status : 302,
			body : null,
			headers : {
				'location' : '/users'
			}
		});
	});


	/**
	 * Test that a request with slash fixing on a request to the root endpoint isn't messed up. 
	 * Technically it's a trailing slash, so I added this test to test the edge case
	 */
	test('test kill slash not breaking on root', () => {
		expect.assertions(1);
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

		return expect(roads.middleware.killSlash.call({}, method, url, body, headers, next)).resolves.toEqual(contents);
	});
});