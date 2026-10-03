
import Client from '../../../src/client/request.js';
import createServer, { port } from '../../resources/mockServer.js';
import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';
import Response from '../../../src/core/response.js';

import { afterAll, beforeAll, describe, expect, test } from 'vitest';

describe('request', () => {
	let server: HttpServer | HttpsServer;

	/**
     * Setup
     */
	beforeAll(() => {
		return createServer()
			.then((newServer: HttpServer | HttpsServer) => {
				server = newServer;
			});
	});

	/**
     * Shutdown
     */
	afterAll(() => {
		return server.close();
	});

	/**
     * Ensure that the basic request system lines up
     */
	test('Request Without Body', () => {
		expect.assertions(3);
		const client = new Client(false, '127.0.0.1', port);

		return new Promise((resolve) => {
			resolve(client.request('GET', '/', undefined, {
				one : 'two'
			}).then(function (response: Response) {
				expect(response.status).toEqual(200);

				const body = JSON.parse(response.body as string);
				// as of node 19 this became uncidi, I don't want to reject old versions for just this one test issue
				delete body.headers['user-agent'];

				expect(body).toEqual({
					url: '/',
					method: 'GET',
					body: '',
					headers: {
						one: 'two',
						accept: '*/*',
						'accept-encoding': 'gzip, deflate',
						'accept-language': '*',
						'sec-fetch-mode': 'cors',
						connection: 'keep-alive',
						host: `127.0.0.1:${port}`,
					},
					message: 'hello!'
				});
				expect(response.headers['this-is']).toEqual('for real');
			}));
		});
	});

	test('Request with duplicate headers', () => {
		expect.assertions(4);
		const client = new Client(false, '127.0.0.1', port);

		return new Promise((resolve) => {
			resolve(client.request('GET', '/headers', undefined, {
				one : ['two', 'three']
			}).then(function (response: Response) {
				expect(response.status).toEqual(200);

				const body = JSON.parse(response.body as string);
				// as of node 19 this became uncidi, I don't want to reject old versions for just this one test issue
				delete body.headers['user-agent'];

				expect(body).toEqual({
					url: '/',
					method: 'GET',
					body: '',
					headers: {
						// node fetch doesn't seem to retain dupe arrays, this is what we get.
						one: 'two, three',
						accept: '*/*',
						'accept-encoding': 'gzip, deflate',
						'accept-language': '*',
						connection: 'keep-alive',
						host: `127.0.0.1:${port}`,
						'sec-fetch-mode': 'cors',
					},
					message: 'hello!'
				});
				// I don't think this is correct for dupliate headers, it seems to be something node-fetch is doing,
				// not sure if it's spec accurate: https://github.com/node-fetch/node-fetch/issues/771
				expect(response.headers['cache-control']).toEqual('no-cache, no-store');
				expect(response.headers['content-type']).toEqual('application/json');
			}));
		});
	});

	/**
     * Ensure that the basic request system lines up
     */
	test('Request With Body', () => {
		expect.assertions(3);
		const client = new Client(false, '127.0.0.1', port);

		return new Promise((resolve) => {
			resolve(client.request('POST', '/', '{"yeah": "what"}', {
				three : 'four'
			}).then(function (response: Response) {
				expect(response.status).toEqual(200);

				const body = JSON.parse(response.body as string);
				// as of node 19 this became uncidi, I don't want to reject old versions for just this one test issue
				delete body.headers['user-agent'];
				expect(body).toMatchObject({
					url: '/',
					method: 'POST',
					body: '{"yeah": "what"}',
					headers: {
						three: 'four',
						'content-type': 'text/plain;charset=UTF-8',
						accept: '*/*',
						'content-length': '16',
						'accept-encoding': 'gzip, deflate',
						connection: 'keep-alive',
						host: `127.0.0.1:${port}`,
					},
					message: 'hello!'
				});

				expect(response.headers['content-type']).toEqual('application/json');
			}));
		});
	});

	/**
	 * Ensure that the path can never send the request to a different host
	 */
	test.each([
		'//evil.example/x',
		'http://evil.example/x',
		'\\\\evil.example/x',
		`https://127.0.0.1:${port}/`,
	])('Request with path %s that changes the origin is rejected', async (path) => {
		const client = new Client(false, '127.0.0.1', port);

		await expect(client.request('GET', path)).rejects.toThrow('must not change the origin');
	});

	test('Request with path missing the leading slash stays on the configured host', async () => {
		const client = new Client(false, '127.0.0.1', port);

		// The mock server has no route for "/@evil.example/", so its 404 proves the request stayed on the configured host
		const response = await client.request('GET', '@evil.example/');

		expect(response.status).toEqual(404);
		expect(response.body).toEqual('Page not found');
	});
});
