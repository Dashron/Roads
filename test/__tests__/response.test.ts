import { Response, RoadResponse } from '../../src/index.js';
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
		const res = new Response(JSON.stringify(response_data), 200, headers);

		expect(res.body).toEqual(JSON.stringify(response_data));
		expect(res.status).toEqual(200);
		expect(res.headers).toEqual(headers);
	});

	test('RoadResponse is the same class as Response', () => {
		expect(RoadResponse).toBe(Response);
	});
});

describe('wrap tests', () => {
	/**
	 * Test that a Response is passed through untouched
	 */
	test('wrap returns the same Response object', async () => {
		const res = new Response('hello', 201, {hello: 'there'});

		await expect(wrap(Promise.resolve(res))).resolves.toBe(res);
	});

	/**
	 * Test that a string is turned into a 200 Response with no headers
	 */
	test('wrap turns a string into a Response', async () => {
		const res = await wrap(Promise.resolve('hello'));

		expect(res).toBeInstanceOf(Response);
		expect(res.body).toEqual('hello');
		expect(res.status).toEqual(200);
		expect(res.headers).toEqual({});
	});

	/**
	 * Test that an empty string is a valid body, not treated like undefined
	 */
	test('wrap turns an empty string into a Response', async () => {
		const res = await wrap(Promise.resolve(''));

		expect(res).toBeInstanceOf(Response);
		expect(res.body).toEqual('');
		expect(res.status).toEqual(200);
	});

	/**
	 * Test that undefined and null reject with a descriptive TypeError
	 */
	test.each([undefined, null])('wrap rejects %s with a TypeError', async (value) => {
		const promise = wrap(Promise.resolve(value) as unknown as Promise<Response | string>);

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
