import { removeTrailingSlashMiddleware } from '../../../middleware/removeTrailingSlash';

import Response from '../../../core/response';

describe('KillSlashes tests', () => {
	test('test remove slash doesn\'t break normal', () => {
		expect.assertions(1);

		const method = 'GET';
		const url = '/users';
		const body = {};
		const headers = {};
		const contents = 'fooo';
		const next = function () {
			return new Promise(function (accept) {
				accept(contents);
			});
		};

		return expect(removeTrailingSlashMiddleware.call({}, method, url, body, headers, next)).resolves.toEqual(contents);
	});

	/**
 * Test that a request with slash fixing, on a request with a trailing slash is turned into a redirect response
 */
	test('test kill slash only trailing slash fixing a route', () => {
		expect.assertions(1);

		const method = 'GET';
		const url = '/users/';
		const body = {};
		const headers = {};
		const contents = 'fooo';
		const next = function () {
			return new Promise(function (accept) {
				accept(contents);
			});
		};

		return expect(removeTrailingSlashMiddleware.call({
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
		const body = {};
		const headers = {};
		const contents = 'fooo';
		const next = function () {
			return new Promise(function (accept) {
				accept(contents);
			});
		};

		return expect(removeTrailingSlashMiddleware.call({}, method, url, body, headers, next)).resolves.toEqual(contents);
	});
});