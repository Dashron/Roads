import {
	CookieMiddleware, CSRFMiddleware, ParseBodyMiddleware, Road, expressConnector
} from '../../../src/index.js';
import { sign, verify } from '../../resources/fakeSigner.js';

import express from 'express';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, test, vi } from 'vitest';

const LIMIT = 1000;

/**
 * These tests send real HTTP requests through Express, to check that a response can still be sent on the
 * 	connection after the connector stops reading an oversized body
 */
describe('expressConnector over HTTP', () => {
	let server: http.Server | undefined;

	afterEach(async () => {
		server?.closeAllConnections();
		await new Promise((resolve) => server?.close(resolve));
		server = undefined;
	});

	// Serves a road that records each request the route receives, and returns the port
	const listen = async (onBodyTooLarge?: () => string) => {
		const routeBodies: unknown[] = [];
		const road = new Road();

		road.use(ParseBodyMiddleware.middleware);
		road.use(async function (method, path, body) {
			routeBodies.push(body);
			return 'route ran';
		});

		const app = express();
		app.use(expressConnector(road, onBodyTooLarge ? { limit: LIMIT, onBodyTooLarge } : { limit: LIMIT }));

		const listening = app.listen(0);
		server = listening;
		await new Promise((resolve) => listening.once('listening', resolve));

		return { port: (listening.address() as AddressInfo).port, routeBodies };
	};

	// Sends a POST. With a content-length header the body is sent as is. Without one, Node sends it with chunked
	// 	encoding, so the server only finds out how large it is by reading it
	const post = (port: number, body: string, headers: Record<string, string> = {}, agent?: http.Agent) => {
		return new Promise<{ status: number | undefined, body: string, contentType: string | undefined }>(
			(resolve, reject) => {
				const req = http.request({ port, method: 'POST', path: '/', headers, agent }, (res) => {
					let responseBody = '';
					res.setEncoding('utf8');
					res.on('data', (chunk) => {
						responseBody += chunk;
					});
					res.on('end', () => resolve({
						status: res.statusCode, body: responseBody, contentType: res.headers['content-type']
					}));
				});

				req.on('error', reject);
				req.write(body);
				req.end();
			});
	};

	const oversized = 'a'.repeat(LIMIT * 500);

	test.each([
		['declared by content-length', { 'content-length': String(oversized.length) }],
		['chunked, without a content-length', {}]
	])('Express responds to an oversized body with a 413, and the road does not run - %s', async (name, headers) => {
		const { port, routeBodies } = await listen();

		const response = await post(port, oversized, headers);

		expect(response.status).toEqual(413);
		expect(routeBodies).toEqual([]);
	});

	test.each([
		['declared by content-length', { 'content-length': String(oversized.length) }],
		['chunked, without a content-length', {}]
	])('onBodyTooLarge responds to an oversized body - %s', async (name, headers) => {
		const { port, routeBodies } = await listen(() => 'Too much');

		const response = await post(port, oversized, headers);

		expect(response).toMatchObject({ status: 413, body: 'Too much' });
		expect(routeBodies).toEqual([]);
	});

	test('a forged header does not make a small body too large', async () => {
		const { port, routeBodies } = await listen();

		const response = await post(port, 'hello', { bodytoolarge: 'true', 'x-body-too-large': 'true' });

		expect(response).toMatchObject({ status: 200, body: 'route ran' });
		expect(routeBodies).toEqual(['hello']);
	});

	test.each([
		['declared by content-length', { 'content-length': String(oversized.length) }],
		['chunked', {}]
	])('the same connection answers the next request after a 413 - %s', async (name, headers) => {
		const { port, routeBodies } = await listen(() => 'Too much');
		// One keep-alive socket, so the second request has to reuse the connection that sent the 413
		const agent = new http.Agent({ keepAlive: true, maxSockets: 1 });

		try {
			expect((await post(port, oversized, headers, agent)).status).toEqual(413);
			expect(await post(port, 'hello', {}, agent)).toMatchObject({ status: 200, body: 'route ran' });
			expect(routeBodies).toEqual(['hello']);
		} finally {
			agent.destroy();
		}
	});

	test('an API road mounted on its own path skips the CSRF check that the site road enforces', async () => {
		// Failed validations are logged, which we don't need to see in the test output
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => { /* silence */ });

		const siteRoad = new Road();
		siteRoad.use(CookieMiddleware.serverMiddleware);
		siteRoad.use(ParseBodyMiddleware.middleware);
		siteRoad.use(CSRFMiddleware.build({ sign, verify }));
		siteRoad.use(async (method, path) => `site ${method} ${path}`);

		const apiRoad = new Road();
		apiRoad.use(ParseBodyMiddleware.middleware);
		apiRoad.use(async (method, path) => `api ${method} ${path}`);

		const app = express();
		app.use('/api', expressConnector(apiRoad));
		app.use(expressConnector(siteRoad));

		const listening = app.listen(0);
		server = listening;
		await new Promise((resolve) => listening.once('listening', resolve));
		const origin = `http://localhost:${(listening.address() as AddressInfo).port}`;

		try {
			// The API road never sees the /api prefix, and has no CSRF middleware to reject the request
			const apiResponse = await fetch(`${origin}/api/posts`, { method: 'POST' });
			expect(apiResponse.status).toEqual(200);
			expect(await apiResponse.text()).toEqual('api POST /posts');

			const siteResponse = await fetch(`${origin}/posts`, { method: 'POST' });
			expect(siteResponse.status).toEqual(403);
			expect(await siteResponse.text()).toEqual('Forbidden');

			expect(await (await fetch(`${origin}/posts`)).text()).toEqual('site GET /posts');
		} finally {
			consoleError.mockRestore();
		}
	});
});
