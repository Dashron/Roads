/* eslint-disable @typescript-eslint/no-explicit-any */

import { middleware, ModifiedSinceContext } from '../../../middleware/modifiedSince';
import Response from '../../../core/response';

describe('modified sine tests', () => {
	test('test not-yet-updated endpoints return 304', async () => {
		expect.assertions(4);

		const context: ModifiedSinceContext  = {} as ModifiedSinceContext;
		const response = await middleware.call(context, 'GET', '/', null, {
			'if-modified-since': 'Fri, 01 Jan 2021 00:00:00 GMT'
		}, () => {
			expect(context.shouldReturnNotModifiedResponse('Wed, 01 Jan 2020 00:00:00 GMT')).toBe(true);
			return Promise.resolve(context.buildNotModifiedResponse());
		});

		expect(response.status).toBe(304);
		expect(response.headers['last-modified']).toBe('Wed, 01 Jan 2020 00:00:00 GMT');
		expect(response.body).toBe('');
	});

	test('test since-updated endpoints don\'t return 304', async() => {
		expect.assertions(4);

		const context: ModifiedSinceContext  = {} as ModifiedSinceContext;
		const response = await middleware.call(context, 'GET', '/', null, {
			'if-modified-since': 'Mon, 01 Jan 1990 00:00:00 GMT'
		}, () => {
			expect(context.shouldReturnNotModifiedResponse('Wed, 01 Jan 2020 00:00:00 GMT')).toBe(false);
			return Promise.resolve(new Response('hi', 200));
		});

		expect(response.status).toBe(200);
		expect(response.headers['last-modified']).toBe('Wed, 01 Jan 2020 00:00:00 GMT');
		expect(response.body).toBe('hi');
	});

	test('test equal update date endpoints return 304', async () => {
		expect.assertions(4);

		const context: ModifiedSinceContext  = {} as ModifiedSinceContext;
		const response = await middleware.call(context, 'GET', '/', null, {
			'if-modified-since': 'Fri, 01 Jan 2021 00:00:00 GMT'
		}, () => {
			expect(context.shouldReturnNotModifiedResponse('Fri, 01 Jan 2021 00:00:00 GMT')).toBe(true);
			return Promise.resolve(context.buildNotModifiedResponse());
		});

		expect(response.status).toBe(304);
		expect(response.headers['last-modified']).toBe('Fri, 01 Jan 2021 00:00:00 GMT');
		expect(response.body).toBe('');
	});
});