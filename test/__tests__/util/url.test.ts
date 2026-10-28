import { parseUrl } from '../../../src/util/url.js';

import { describe, expect, test } from 'vitest';

describe('parseUrl', () => {
	test.each([
		['/users', '/users', '', ''],
		['/users?page=2', '/users', '?page=2', ''],
		['/users#top', '/users', '', '#top'],
		['/users?page=2#top', '/users', '?page=2', '#top'],
		// A ? inside the hash is part of the hash
		['/users#top?page=2', '/users', '', '#top?page=2'],
		['/users?#', '/users', '', ''],
		['', '', '', ''],
		// Absolute urls are reduced to their path
		['https://example.com/users?page=2#top', '/users', '?page=2', '#top']
	])('splits %s', (url, pathname, search, hash) => {
		const parsed = parseUrl(url);

		expect(parsed.pathname).toEqual(pathname);
		expect(parsed.search).toEqual(search);
		expect(parsed.hash).toEqual(hash);
	});

	test('does not treat a leading double slash as a host', () => {
		expect(parseUrl('//evil.com/users').pathname).toEqual('//evil.com/users');
	});

	test('leaves the path percent-encoded', () => {
		expect(parseUrl('/a%20b').pathname).toEqual('/a%20b');
	});

	test('decodes the query string, keeping the first value of repeated keys', () => {
		const parsed = parseUrl('/?a=1&a=2&b=x+y&c=%C3%A9&d');

		expect({ ...parsed.query }).toEqual({ a: '1', b: 'x y', c: 'é', d: '' });
		expect(parsed.searchParams.getAll('a')).toEqual(['1', '2']);
	});

	test('stores __proto__ as a plain query value', () => {
		const parsed = parseUrl('/?__proto__=x');

		expect(Object.getPrototypeOf(parsed.query)).toBeNull();
		expect(parsed.query['__proto__']).toEqual('x');
	});
});
