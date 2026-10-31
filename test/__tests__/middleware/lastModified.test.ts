

import { middleware, ModifiedSinceContext } from '../../../src/middleware/modifiedSince.js';
import Response from '../../../src/core/response.js';

import { describe, expect, test } from 'vitest';

/**
 * Helper function to ensure middleware returns a Response object
 * Throws an error if the result is not a Response object
 */
async function ensureResponse(middlewarePromise: Promise<Response | string> | Response | string): Promise<Response> {
	const result = await middlewarePromise;
	if (!(result instanceof Response)) {
		throw new Error(`Expected Response object but got: ${typeof result}`);
	}
	return result;
}

describe('modified sine tests', () => {
	test('test not-yet-updated endpoints return 304', async () => {
		expect.assertions(4);

		const context: ModifiedSinceContext  = {} as ModifiedSinceContext;
		const response = await ensureResponse(middleware.call(context, 'GET', '/', undefined, {
			'if-modified-since': 'Fri, 01 Jan 2021 00:00:00 GMT'
		}, () => {
			expect(context.shouldReturnNotModifiedResponse('Wed, 01 Jan 2020 00:00:00 GMT')).toBe(true);
			return Promise.resolve(context.buildNotModifiedResponse());
		}));

		expect(response.status).toBe(304);
		expect(response.headers['last-modified']).toBe('Wed, 01 Jan 2020 00:00:00 GMT');
		expect(response.body).toBe('');
	});

	test('test since-updated endpoints don\'t return 304', async() => {
		expect.assertions(4);

		const context: ModifiedSinceContext  = {} as ModifiedSinceContext;
		const response = await ensureResponse(middleware.call(context, 'GET', '/', undefined, {
			'if-modified-since': 'Mon, 01 Jan 1990 00:00:00 GMT'
		}, () => {
			expect(context.shouldReturnNotModifiedResponse('Wed, 01 Jan 2020 00:00:00 GMT')).toBe(false);
			return Promise.resolve(new Response('hi', 200));
		}));

		expect(response.status).toBe(200);
		expect(response.headers['last-modified']).toBe('Wed, 01 Jan 2020 00:00:00 GMT');
		expect(response.body).toBe('hi');
	});

	test('test equal update date endpoints return 304', async () => {
		expect.assertions(4);

		const context: ModifiedSinceContext  = {} as ModifiedSinceContext;
		const response = await ensureResponse(middleware.call(context, 'GET', '/', undefined, {
			'if-modified-since': 'Fri, 01 Jan 2021 00:00:00 GMT'
		}, () => {
			expect(context.shouldReturnNotModifiedResponse('Fri, 01 Jan 2021 00:00:00 GMT')).toBe(true);
			return Promise.resolve(context.buildNotModifiedResponse());
		}));

		expect(response.status).toBe(304);
		expect(response.headers['last-modified']).toBe('Fri, 01 Jan 2021 00:00:00 GMT');
		expect(response.body).toBe('');
	});

	/**
	 * Runs the middleware, calling shouldReturnNotModifiedResponse with lastModified from inside the route
	 */
	async function check (method: string, headers: Record<string, string | string[]>, lastModified: string | Date) {
		const context: ModifiedSinceContext = {} as ModifiedSinceContext;
		let notModified: boolean | undefined;

		const response = await ensureResponse(middleware.call(context, method, '/', undefined, headers, () => {
			notModified = context.shouldReturnNotModifiedResponse(lastModified);
			return Promise.resolve(new Response('hi', 200));
		}));

		return { notModified, response };
	}

	test('test a last modified date with milliseconds is not modified since its own http date', async () => {
		const lastModified = new Date('2021-01-01T00:00:00.500Z');
		const { notModified, response } = await check('GET', {
			'if-modified-since': lastModified.toUTCString()
		}, lastModified);

		expect(notModified).toBe(true);
		expect(response.headers['last-modified']).toBe('Fri, 01 Jan 2021 00:00:00 GMT');
	});

	test('test a last modified date one second after if-modified-since is modified', async () => {
		const { notModified } = await check('GET', {
			'if-modified-since': 'Fri, 01 Jan 2021 00:00:00 GMT'
		}, new Date('2021-01-01T00:00:01.000Z'));

		expect(notModified).toBe(false);
	});

	test('test an invalid last modified date is modified and sends no last-modified header', async () => {
		const { notModified, response } = await check('GET', {
			'if-modified-since': 'Fri, 01 Jan 2021 00:00:00 GMT'
		}, 'not a date');

		expect(notModified).toBe(false);
		expect(response.headers['last-modified']).toBeUndefined();
	});

	test('test an invalid if-modified-since header is ignored', async () => {
		const { notModified, response } = await check('GET', {
			'if-modified-since': 'not a date'
		}, 'Wed, 01 Jan 2020 00:00:00 GMT');

		expect(notModified).toBe(false);
		expect(response.headers['last-modified']).toBe('Wed, 01 Jan 2020 00:00:00 GMT');
	});

	test.each(['GET', 'HEAD'])('test if-modified-since applies to %s requests', async (method) => {
		const { notModified } = await check(method, {
			'if-modified-since': 'Fri, 01 Jan 2021 00:00:00 GMT'
		}, 'Wed, 01 Jan 2020 00:00:00 GMT');

		expect(notModified).toBe(true);
	});

	test.each(['POST', 'PUT', 'PATCH', 'DELETE'])('test if-modified-since is ignored for %s requests', async (method) => {
		const { notModified, response } = await check(method, {
			'if-modified-since': 'Fri, 01 Jan 2021 00:00:00 GMT'
		}, 'Wed, 01 Jan 2020 00:00:00 GMT');

		expect(notModified).toBe(false);
		expect(response.headers['last-modified']).toBe('Wed, 01 Jan 2020 00:00:00 GMT');
	});

	test('test if-modified-since is ignored when if-none-match is sent', async () => {
		const { notModified } = await check('GET', {
			'if-modified-since': 'Fri, 01 Jan 2021 00:00:00 GMT',
			'if-none-match': '"abc"'
		}, 'Wed, 01 Jan 2020 00:00:00 GMT');

		expect(notModified).toBe(false);
	});

	test('test a string response is wrapped so it gets the last-modified header', async () => {
		const context: ModifiedSinceContext = {} as ModifiedSinceContext;
		const response = await ensureResponse(middleware.call(context, 'GET', '/', undefined, {}, () => {
			context.shouldReturnNotModifiedResponse('Wed, 01 Jan 2020 00:00:00 GMT');
			return Promise.resolve('hi');
		}));

		expect(response.status).toBe(200);
		expect(response.body).toBe('hi');
		expect(response.headers['last-modified']).toBe('Wed, 01 Jan 2020 00:00:00 GMT');
	});

	test('test a string response is left alone when no date was checked', async () => {
		const context: ModifiedSinceContext = {} as ModifiedSinceContext;
		const response = await middleware.call(context, 'GET', '/', undefined, {}, () => Promise.resolve('hi'));

		expect(response).toBe('hi');
	});

	test('test the first of several if-modified-since values is used', async () => {
		const { notModified } = await check('GET', {
			'if-modified-since': ['Fri, 01 Jan 2021 00:00:00 GMT', 'Mon, 01 Jan 1990 00:00:00 GMT']
		}, 'Wed, 01 Jan 2020 00:00:00 GMT');

		expect(notModified).toBe(true);
	});
});