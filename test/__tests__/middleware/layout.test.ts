import { build } from '../../../src/middleware/layout.js';
import Road from '../../../src/core/road.js';
import { Context } from '../../../src/core/road.js';
import RoadsResponse from '../../../src/core/response.js';

import { describe, expect, test } from 'vitest';

const wrap = (body: string) => `<main>${body}</main>`;

// Builds a road with the layout, and a final middleware that returns the given response
const buildRoad = (response: RoadsResponse | string, layout = wrap) => {
	const road = new Road();
	road.use(build(layout));
	road.use(() => Promise.resolve(response));
	return road;
};

describe('Layout middleware tests', () => {
	test('wraps a string response, and keeps the default status', async () => {
		const response = await buildRoad('Hello').request('GET', '/');

		expect(response.body).toBe('<main>Hello</main>');
		expect(response.status).toBe(200);
	});

	test('wraps a response object, and keeps its status and headers', async () => {
		const response = await buildRoad(new RoadsResponse('Missing', 404, { 'x-test': 'yes' })).request('GET', '/');

		expect(response.body).toBe('<main>Missing</main>');
		expect(response.status).toBe(404);
		expect(response.headers['x-test']).toBe('yes');
	});

	test('wraps a response with an HTML content type', async () => {
		const response = await buildRoad(new RoadsResponse('Hi', 200, { 'content-type': 'text/html; charset=utf-8' }))
			.request('GET', '/');

		expect(response.body).toBe('<main>Hi</main>');
	});

	test('wraps a Buffer body as a string', async () => {
		const response = await buildRoad(new RoadsResponse(Buffer.from('Hi'))).request('GET', '/');

		expect(response.body).toBe('<main>Hi</main>');
	});

	test('does not wrap a response with a non-HTML content type, in any case', async () => {
		const json = new RoadsResponse('{}', 200, { 'Content-Type': 'application/json' });
		const response = await buildRoad(json).request('GET', '/');

		expect(response.body).toBe('{}');
	});

	test('does not wrap redirects or 304 responses', async () => {
		const redirect = await buildRoad(new RoadsResponse('', 302, { location: '/' })).request('GET', '/');
		const notModified = await buildRoad(new RoadsResponse('', 304)).request('GET', '/');

		expect(redirect.body).toBe('');
		expect(notModified.body).toBe('');
	});

	test('passes the request context to the layout, and waits for an async layout', async () => {
		const road = new Road();
		road.use(function (this: Context, method, path, body, headers, next) {
			this['siteName'] = 'Site';
			return next();
		});
		road.use(build(async (body, context) => `<h1>${String(context['siteName'])}</h1>${body}`));
		road.use(() => Promise.resolve('Hi'));

		const response = await road.request('GET', '/');

		expect(response.body).toBe('<h1>Site</h1>Hi');
	});

	test('wraps the 404 when no middleware is left', async () => {
		const road = new Road();
		road.use(build(wrap));

		const response = await road.request('GET', '/');

		expect(response.status).toBe(404);
		expect(response.body).toBe('<main>Page not found</main>');
	});
});
