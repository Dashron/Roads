import { middleware } from '../../../src/middleware/removeTrailingSlash.js';

import Response from '../../../src/core/response.js';
import Road from '../../../src/core/road.js';
import { attachCommonMiddleware } from '../../../src/index.js';

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

	/**
	 * Test that leading slashes can't turn the redirect into a protocol-relative URL to another host
	 */
	test.each([
		['//evil.com/path/', '/evil.com/path'],
		['///evil.com/path/', '/evil.com/path'],
		['/\\evil.com/path/', '/evil.com/path'],
		['/\\/evil.com/', '/evil.com'],
		['//evil.com/?a=1#b', '/evil.com?a=1#b'],
		['\\\\evil.com/path/', '/evil.com/path'],
		// browsers strip tabs and newlines from URLs, which would otherwise rejoin the slashes
		['/\t/evil.com/', '/evil.com'],
		['/\n/evil.com/', '/evil.com'],
		['/\r\n/evil.com/', '/evil.com'],
		// encoded slashes are never treated as separators by browsers, so they are left alone
		['/%2F/evil.com/', '/%2F/evil.com'],
		['/%5Cevil.com/', '/%5Cevil.com']
	])('test remove slash does not redirect %s off-site', (url, location) => {
		expect.assertions(1);
		const next = function () {
			return Promise.resolve('should not be called');
		};

		return expect(middleware.call({}, 'GET', url, '', {}, next)).resolves.toEqual({
			status: 302,
			body: '',
			headers: {
				location
			}
		});
	});

	/**
	 * Test the exploit end to end through a road using attachCommonMiddleware, which is how most apps get this middleware
	 */
	test('test common middleware never redirects to another host', async () => {
		const road = new Road();
		attachCommonMiddleware(road);
		road.use(() => 'ok');

		const attempts = ['//evil.com/', '//evil.com/a/b/', '///evil.com/', '/\\evil.com/', '\\\\evil.com/',
			'/\\/\\evil.com/', '/\t/evil.com/', '//evil.com:8080/', '//user@evil.com/', '//evil.com/?next=/'];

		for (const url of attempts) {
			const response = await road.request('GET', url);
			const location = String(response.headers['location']);

			expect(response.status, url).toBe(302);
			// A browser resolves the location against http://example.com, so the host must not change
			expect(new URL(location, 'http://example.com').host, `${url} -> ${location}`).toBe('example.com');
		}
	});
});