/* eslint-disable @typescript-eslint/ban-ts-comment */
import Client from '../../../client/request';
import createServer, { port } from '../../resources/mockServer';
import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';
import Response from '../../../core/response';
import fetch, { Headers, Request, Response as FetchResponse } from 'node-fetch';


if (!globalThis.fetch) {
	// @ts-ignore
	globalThis.fetch = fetch;
	// @ts-ignore
	globalThis.Headers = Headers;
	// @ts-ignore
	globalThis.Request = Request;
	// @ts-ignore
	globalThis.Response = FetchResponse;
}

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
				expect(response.body).toEqual(JSON.stringify({
					url: '/',
					method: 'GET',
					body: '',
					headers: {
						one: 'two',
						accept: '*/*',
						'user-agent': 'node-fetch/1.0 (+https://github.com/bitinn/node-fetch)',
						'accept-encoding': 'gzip,deflate',
						connection: 'close',
						host: `127.0.0.1:${port}`,
					},
					message: 'hello!'
				}));
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
				expect(response.body).toEqual(JSON.stringify({
					url: '/',
					method: 'GET',
					body: '',
					headers: {
						// node fetch doesn't seem to retain dupe arrays, this is what we get.
						one: 'two, three',
						accept: '*/*',
						'user-agent': 'node-fetch/1.0 (+https://github.com/bitinn/node-fetch)',
						'accept-encoding': 'gzip,deflate',
						connection: 'close',
						host: `127.0.0.1:${port}`,
					},
					message: 'hello!'
				}));
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

				expect(response.body).toEqual(JSON.stringify({
					url: '/',
					method: 'POST',
					body: '{"yeah": "what"}',
					headers: {
						three: 'four',
						'content-type': 'text/plain;charset=UTF-8',
						accept: '*/*',
						'content-length': '16',
						'user-agent': 'node-fetch/1.0 (+https://github.com/bitinn/node-fetch)',
						'accept-encoding': 'gzip,deflate',
						connection: 'close',
						host: `127.0.0.1:${port}`,
					},
					message: 'hello!'
				}));

				expect(response.headers['content-type']).toEqual('application/json');
			}));
		});
	});
});