import { parseUrl, toOriginForm } from '../../../src/util/url.js';

import { describe, expect, test } from 'vitest';

describe('toOriginForm', () => {
	test.each([
		['http://h/a?b', '/a?b'],
		['http://h?x=1', '/?x=1'],
		['http://h#top', '/#top'],
		['http://h', '/'],
		['http://', '/'],
		['HTTP://h/a', '/a'],
		// Dot segments and extra slashes are kept, the same as a url that was only a path
		['http://h/x/../a', '/x/../a'],
		['http://h//a', '//a'],
		// These are not absolute urls
		['/a', '/a'],
		['//h/a', '//h/a'],
		['/a?u=http://h/b', '/a?u=http://h/b'],
		['', '']
	])('reduces %s to %s', (url, expected) => {
		expect(toOriginForm(url)).toEqual(expected);
	});
});

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

	test('does not throw on an absolute url without a host', () => {
		expect(parseUrl('http://').pathname).toEqual('/');
	});

	test('does not collapse dot segments in an absolute url', () => {
		expect(parseUrl('http://h/x/../a').pathname).toEqual('/x/../a');
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
