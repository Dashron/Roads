import { RoadsResponse } from '../../src/index.js';
import { wrap } from '../../src/core/response.js';

import { describe, expect, test } from 'vitest';

describe('response tests', () => {
	/**
	 * Test that the constructor fields are accessible by the proper attributes.
	 */
	test('Constructor applies to body', () => {
		expect.assertions(3);
		const response_data = { message : 'hello' };
		const headers = {hello: 'there'};
		const res = new RoadsResponse(JSON.stringify(response_data), 200, headers);

		expect(res.body).toEqual(JSON.stringify(response_data));
		expect(res.status).toEqual(200);
		expect(res.headers).toEqual(headers);
	});

	/**
	 * Test that header names are stored in lower case, and can be read with any casing
	 */
	test('Constructor headers can be read with any casing, and are listed in lower case', () => {
		const res = new RoadsResponse('hello', 200, { 'Content-Type': 'text/html', 'X-Test': ['a', 'b'] });

		expect(res.headers).toEqual({ 'content-type': 'text/html', 'x-test': ['a', 'b'] });
		expect(Object.keys(res.headers)).toEqual(['content-type', 'x-test']);
		expect(res.headers['content-type']).toEqual('text/html');
		expect(res.headers['Content-Type']).toEqual('text/html');
		expect(res.headers['CONTENT-TYPE']).toEqual('text/html');
	});

	/**
	 * Test that a header assigned after the response is created is the same header in any casing
	 */
	test('A header assigned with one casing is read, replaced and listed case-insensitively', () => {
		const res = new RoadsResponse('hello');

		res.headers['X-Request-Id'] = 'first';

		expect(res.headers['x-request-id']).toEqual('first');
		expect(Object.keys(res.headers)).toEqual(['x-request-id']);

		res.headers['x-REQUEST-id'] = 'second';

		expect(res.headers['X-Request-Id']).toEqual('second');
		expect(res.headers).toEqual({ 'x-request-id': 'second' });
	});

	/**
	 * Test that checking for and deleting a header ignores casing
	 */
	test('A header is found and deleted with any casing', () => {
		const res = new RoadsResponse('hello', 200, { 'content-type': 'text/html' });

		expect('Content-Type' in res.headers).toBe(true);
		expect(Object.hasOwn(res.headers, 'Content-Type')).toBe(true);
		expect('x-missing' in res.headers).toBe(false);

		delete res.headers['Content-Type'];

		expect(res.headers['content-type']).toBeUndefined();
		expect(res.headers).toEqual({});
	});

	/**
	 * Test that replacing the whole headers object keeps the names case-insensitive
	 */
	test('Assigning a new headers object keeps header names case-insensitive', () => {
		const res = new RoadsResponse('hello', 200, { 'x-old': 'yes' });

		res.headers = { 'Cache-Control': 'no-store' };
		res.headers['X-Test'] = 'yes';

		expect(res.headers).toEqual({ 'cache-control': 'no-store', 'x-test': 'yes' });
		expect(res.headers['cache-control']).toEqual('no-store');
	});

	/**
	 * Test that the headers are still part of the response when it is compared, copied or serialized
	 */
	test('Headers are an enumerable property of the response', () => {
		const res = new RoadsResponse('hello', 201, { 'X-Test': 'yes' });

		expect(Object.keys(res)).toContain('headers');
		expect(JSON.parse(JSON.stringify(res))).toEqual({ body: 'hello', status: 201, headers: { 'x-test': 'yes' } });
		expect(res).toEqual(new RoadsResponse('hello', 201, { 'x-test': 'yes' }));
		expect(res).not.toEqual(new RoadsResponse('hello', 201, { 'x-test': 'no' }));
	});

	/**
	 * Test that the headers of a subclass behave the same way
	 */
	test('A subclass has case-insensitive headers', () => {
		class PageResponse extends RoadsResponse {
			title = 'Home';
		}

		const res = new PageResponse('hello', 200, { 'Content-Type': 'text/html' });

		expect(res.headers['content-type']).toEqual('text/html');
		expect(res.title).toEqual('Home');
	});

	/**
	 * Test that names that only differ by case become one header with every value
	 */
	test('Constructor merges header names that only differ by case', () => {
		const res = new RoadsResponse('hello', 200, { 'Set-Cookie': 'a=1', 'set-cookie': ['b=2', 'c=3'] });

		expect(res.headers).toEqual({ 'set-cookie': ['a=1', 'b=2', 'c=3'] });
	});

	/**
	 * Test that the response keeps its own copy of the headers
	 */
	test('Constructor does not change the headers object it is given', () => {
		const headers = { 'Content-Type': 'text/html' };
		const res = new RoadsResponse('hello', 200, headers);

		res.headers['x-test'] = 'yes';

		expect(headers).toEqual({ 'Content-Type': 'text/html' });
	});
});

describe('wrap tests', () => {
	/**
	 * Test that a RoadsResponse is passed through untouched
	 */
	test('wrap returns the same RoadsResponse object', async () => {
		const res = new RoadsResponse('hello', 201, {hello: 'there'});

		await expect(wrap(Promise.resolve(res))).resolves.toBe(res);
	});

	/**
	 * Test that a string is turned into a 200 RoadsResponse with no headers
	 */
	test('wrap turns a string into a RoadsResponse', async () => {
		const res = await wrap(Promise.resolve('hello'));

		expect(res).toBeInstanceOf(RoadsResponse);
		expect(res.body).toEqual('hello');
		expect(res.status).toEqual(200);
		expect(res.headers).toEqual({});
	});

	/**
	 * Test that an empty string is a valid body, not treated like undefined
	 */
	test('wrap turns an empty string into a RoadsResponse', async () => {
		const res = await wrap(Promise.resolve(''));

		expect(res).toBeInstanceOf(RoadsResponse);
		expect(res.body).toEqual('');
		expect(res.status).toEqual(200);
	});

	/**
	 * Test that undefined and null reject with a descriptive TypeError
	 */
	test.each([undefined, null])('wrap rejects %s with a TypeError', async (value) => {
		const promise = wrap(Promise.resolve(value) as unknown as Promise<RoadsResponse | string>);

		await expect(promise).rejects.toThrow(TypeError);
		await expect(promise).rejects.toThrow(`resolved to ${String(value)}`);
	});

	/**
	 * Test that a rejection from the request chain is passed through unchanged
	 */
	test('wrap passes rejections through', async () => {
		const err = new Error('chain failed');

		await expect(wrap(Promise.reject(err))).rejects.toBe(err);
	});
});
