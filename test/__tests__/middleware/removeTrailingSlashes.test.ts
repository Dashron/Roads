import { middleware } from '../../../src/middleware/removeTrailingSlash.js';

import Response from '../../../src/core/response.js';

import { describe, expect, test } from 'vitest';

describe('KillSlashes tests', () => {
	test('test remove slash doesn\'t break normal', () => {
		expect.assertions(1);

		const method = 'GET';
		const url = '/users';
		const body = '';
		const headers = {};
		const contents = 'fooo';
		const next = function () {
			return new Promise<string>(function (accept) {
				accept(contents);
			});
		};

		return expect(middleware.call({}, method, url, body, headers, next)).resolves.toEqual(contents);
	});

	/**
 * Test that a request with slash fixing, on a request with a trailing slash is turned into a redirect response
 */
	test('test kill slash only trailing slash fixing a route', () => {
		expect.assertions(1);

		const method = 'GET';
		const url = '/users/';
		const body = '';
		const headers = {};
		const contents = 'fooo';
		const next = function () {
			return new Promise<string>(function (accept) {
				accept(contents);
			});
		};

		return expect(middleware.call({
			// the redirection needs the Response context
			Response : Response
		}, method, url, body, headers, next)).resolves.toEqual({
			status : 302,
			body : '',
			headers : {
				location : '/users'
			}
		});
	});


	/**
	 * Test that a request with slash fixing on a request to the root endpoint isn't messed up.
	 * Technically it's a trailing slash, so I added this test to test the edge case
	 */
	test('test remove slash not breaking on root', () => {
		expect.assertions(1);
		const method = 'GET';
		const url = '/';
		const body = '';
		const headers = {};
		const contents = 'fooo';
		const next = function () {
			return new Promise<string>(function (accept) {
				accept(contents);
			});
		};

		return expect(middleware.call({}, method, url, body, headers, next)).resolves.toEqual(contents);
	});

	/**
	 * Test that query strings are preserved when removing trailing slash
	 */
	test('test remove slash preserves query string', () => {
		expect.assertions(1);
		const method = 'GET';
		const url = '/users/?page=2&sort=name';
		const body = '';
		const headers = {};
		const next = function () {
			return Promise.resolve('should not be called');
		};

		return expect(middleware.call({}, method, url, body, headers, next)).resolves.toEqual({
			status: 302,
			body: '',
			headers: {
				location: '/users?page=2&sort=name'
			}
		});
	});

	/**
	 * Test that hash fragments are preserved when removing trailing slash
	 */
	test('test remove slash preserves hash fragment', () => {
		expect.assertions(1);
		const method = 'GET';
		const url = '/users/#section';
		const body = '';
		const headers = {};
		const next = function () {
			return Promise.resolve('should not be called');
		};

		return expect(middleware.call({}, method, url, body, headers, next)).resolves.toEqual({
			status: 302,
			body: '',
			headers: {
				location: '/users#section'
			}
		});
	});

	/**
	 * Test that both query strings and hash fragments are preserved
	 */
	test('test remove slash preserves query string and hash', () => {
		expect.assertions(1);
		const method = 'GET';
		const url = '/users/?page=2#top';
		const body = '';
		const headers = {};
		const next = function () {
			return Promise.resolve('should not be called');
		};

		return expect(middleware.call({}, method, url, body, headers, next)).resolves.toEqual({
			status: 302,
			body: '',
			headers: {
				location: '/users?page=2#top'
			}
		});
	});
});