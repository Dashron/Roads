import { ParseBodyMiddleware, Road, RoadsResponse, expressConnector } from '../../../src/index.js';

import { PassThrough } from 'node:stream';
import { describe, expect, test, vi } from 'vitest';

const buildRes = () => ({
	status: vi.fn(),
	header: vi.fn(),
	send: vi.fn()
});

const buildReq = (body?: unknown) => ({
	method: 'POST',
	url: '/users?page=2',
	body,
	headers: { 'content-type': 'text/plain' }
});

describe('expressConnector tests', () => {
	test('passes the method, url, body and headers to the road', async () => {
		let received: unknown[] = [];
		const road = new Road();
		road.use(async function (method, path, body, headers) {
			received = [method, path, body, headers];
			return 'ok';
		});

		await expressConnector(road)(buildReq('hello'), buildRes(), vi.fn());

		expect(received).toEqual(['POST', '/users?page=2', 'hello', { 'content-type': 'text/plain' }]);
	});

	test('a request without a body and without a stream passes undefined', async () => {
		let received: unknown = 'unset';
		const road = new Road();
		road.use(async function (method, path, requestBody) {
			received = requestBody;
			return 'ok';
		});

		await expressConnector(road)(buildReq(), buildRes(), vi.fn());

		expect(received).toBeUndefined();
	});

	test('a Buffer body from express.raw() is passed as a string', async () => {
		const road = new Road();
		road.use(async function (method, path, body) {
			return String(body);
		});

		const res = buildRes();
		await expressConnector(road)(buildReq(Buffer.from('hello')), res, vi.fn());

		expect(res.send).toHaveBeenCalledWith('hello');
	});

	test.each([[{}], [{ name: 'dashron' }]])('a body another middleware parsed into an object is an error - %j',
		async (body) => {
			const road = new Road();
			road.use(async function () {
				return 'ok';
			});

			const res = buildRes();
			const next = vi.fn();
			await expressConnector(road)(buildReq(body), res, next);

			expect(next).toHaveBeenCalledWith(expect.any(TypeError));
			expect(res.send).not.toHaveBeenCalled();
		});

	describe('reading the body from the request stream', () => {
		// Builds an unread request stream, like the request Express passes to its middleware
		const buildStreamReq = (headers: Record<string, string> = {}) => {
			const stream = new PassThrough();
			return Object.assign(stream, { method: 'POST', url: '/users', headers, body: undefined });
		};

		const echoRoad = () => {
			const road = new Road();
			road.use(async function (method, path, body) {
				return body === undefined ? 'no body' : String(body);
			});
			return road;
		};

		test('the body is read from the stream', async () => {
			const req = buildStreamReq();
			const res = buildRes();
			const done = expressConnector(echoRoad())(req, res, vi.fn());

			req.write('{"name":');
			req.end('"dashron"}');
			await done;

			expect(res.send).toHaveBeenCalledWith('{"name":"dashron"}');
		});

		test('a character split across two chunks is decoded correctly', async () => {
			const req = buildStreamReq();
			const res = buildRes();
			const done = expressConnector(echoRoad())(req, res, vi.fn());

			const bytes = Buffer.from('é');
			req.write(bytes.subarray(0, 1));
			req.end(bytes.subarray(1));
			await done;

			expect(res.send).toHaveBeenCalledWith('é');
		});

		test('an empty stream passes undefined', async () => {
			const req = buildStreamReq();
			const res = buildRes();
			const done = expressConnector(echoRoad())(req, res, vi.fn());

			req.end();
			await done;

			expect(res.send).toHaveBeenCalledWith('no body');
		});

		describe('a body over the limit', () => {
			// Records whether the road ran
			const buildTooLargeRoad = () => {
				const log: unknown[] = [];
				const road = new Road();

				road.use(ParseBodyMiddleware.middleware);
				road.use(async function (method, path, body) {
					log.push(body);
					return 'route ran';
				});

				return { road, log };
			};

			test('found while reading the stream, the road does not run and Express gets a 413 error', async () => {
				const { road, log } = buildTooLargeRoad();
				const req = buildStreamReq();
				const res = buildRes();
				const next = vi.fn();
				const done = expressConnector(road, { limit: 5 })(req, res, next);

				req.write('abc');
				req.write('def');
				await done;

				expect(log).toEqual([]);
				expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 413, statusCode: 413 }));
				expect(res.send).not.toHaveBeenCalled();
				// The stream is not destroyed, so the connection can still send the response. The rest of the
				// 	body is read and thrown away
				expect(req.destroyed).toBe(false);
				expect(req.readableFlowing).toBe(true);
				expect(req.listenerCount('data')).toBe(0);
			});

			test('declared by content-length, the body is not read and Express gets a 413 error', async () => {
				const { road, log } = buildTooLargeRoad();
				const req = buildStreamReq({ 'content-length': '6' });
				const res = buildRes();
				const next = vi.fn();

				await expressConnector(road, { limit: 5 })(req, res, next);

				expect(log).toEqual([]);
				expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 413, statusCode: 413 }));
				expect(res.send).not.toHaveBeenCalled();
				expect(req.readableDidRead).toBe(false);
			});

			test('a content-length that understates the body is caught while reading the stream', async () => {
				const { road, log } = buildTooLargeRoad();
				const req = buildStreamReq({ 'content-length': '3' });
				const next = vi.fn();
				const done = expressConnector(road, { limit: 5 })(req, buildRes(), next);

				req.write('abcdef');
				await done;

				expect(log).toEqual([]);
				expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 413 }));
			});

			test('onBodyTooLarge receives the request, and its response is sent', async () => {
				const { road, log } = buildTooLargeRoad();
				const req = buildStreamReq({ 'content-length': '6' });
				const res = buildRes();
				const next = vi.fn();
				const onBodyTooLarge = vi.fn(async () => new RoadsResponse('{"error":"too large"}', 413, {
					'content-type': 'application/json'
				}));

				await expressConnector(road, { limit: 5, onBodyTooLarge })(req, res, next);

				expect(onBodyTooLarge).toHaveBeenCalledWith(req);
				expect(log).toEqual([]);
				expect(next).not.toHaveBeenCalled();
				expect(res.status).toHaveBeenCalledWith(413);
				expect(res.header).toHaveBeenCalledWith('content-type', 'application/json');
				expect(res.send).toHaveBeenCalledWith('{"error":"too large"}');
			});

			test('a string from onBodyTooLarge is sent with a status of 413', async () => {
				const { road } = buildTooLargeRoad();
				const res = buildRes();
				const done = expressConnector(road, { limit: 5, onBodyTooLarge: () => 'Too much' })(
					buildStreamReq({ 'content-length': '6' }), res, vi.fn());
				await done;

				expect(res.status).toHaveBeenCalledWith(413);
				expect(res.header).not.toHaveBeenCalled();
				expect(res.send).toHaveBeenCalledWith('Too much');
			});

			test('an error thrown by onBodyTooLarge is passed to Express', async () => {
				const { road } = buildTooLargeRoad();
				const res = buildRes();
				const next = vi.fn();
				const error = new Error('hook failed');

				await expressConnector(road, { limit: 5, onBodyTooLarge: () => {
					throw error;
				} })(buildStreamReq({ 'content-length': '6' }), res, next);

				expect(next).toHaveBeenCalledWith(error);
				expect(res.send).not.toHaveBeenCalled();
			});

			test('onBodyTooLarge is not called for a body within the limit', async () => {
				const { road, log } = buildTooLargeRoad();
				const onBodyTooLarge = vi.fn(() => 'Too much');
				const res = buildRes();
				const req = buildStreamReq();
				const done = expressConnector(road, { limit: 5, onBodyTooLarge })(req, res, vi.fn());

				req.end('abc');
				await done;

				expect(onBodyTooLarge).not.toHaveBeenCalled();
				expect(log).toEqual(['abc']);
				expect(res.send).toHaveBeenCalledWith('route ran');
			});
		});

		test('a body at the limit is read', async () => {
			const req = buildStreamReq();
			const res = buildRes();
			const done = expressConnector(echoRoad(), { limit: 5 })(req, res, vi.fn());

			req.end('abcde');
			await done;

			expect(res.send).toHaveBeenCalledWith('abcde');
		});

		test('a stream error is passed to next', async () => {
			const req = buildStreamReq();
			const next = vi.fn();
			const done = expressConnector(echoRoad())(req, buildRes(), next);

			const err = new Error('connection reset');
			req.destroy(err);
			await done;

			expect(next).toHaveBeenCalledWith(err);
		});

		test('a string body from express.text() is used, and the stream is not read again', async () => {
			const req = Object.assign(buildStreamReq(), { body: 'from express.text' });
			const res = buildRes();

			await expressConnector(echoRoad())(req, res, vi.fn());

			expect(res.send).toHaveBeenCalledWith('from express.text');
		});
	});

	test('copies the status, headers and body to the express response', async () => {
		const road = new Road();
		road.use(async function () {
			return new RoadsResponse('created', 201, {
				location: '/users/1',
				'set-cookie': ['a=1', 'b=2'],
				'x-missing': undefined
			});
		});

		const res = buildRes();
		const next = vi.fn();
		await expressConnector(road)(buildReq(), res, next);

		expect(res.status).toHaveBeenCalledWith(201);
		expect(res.header).toHaveBeenCalledTimes(2);
		expect(res.header).toHaveBeenCalledWith('location', '/users/1');
		expect(res.header).toHaveBeenCalledWith('set-cookie', ['a=1', 'b=2']);
		expect(res.send).toHaveBeenCalledWith('created');
		expect(next).not.toHaveBeenCalled();
	});

	test('a string response is sent with a status of 200', async () => {
		const road = new Road();
		road.use(async function () {
			return 'hello';
		});

		const res = buildRes();
		await expressConnector(road)(buildReq(), res, vi.fn());

		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.send).toHaveBeenCalledWith('hello');
	});

	test('an error from the road is passed to next, and nothing is sent', async () => {
		const err = new Error('boom');
		const road = new Road();
		road.use(async function () {
			throw err;
		});

		const res = buildRes();
		const next = vi.fn();
		await expressConnector(road)(buildReq(), res, next);

		expect(next).toHaveBeenCalledWith(err);
		expect(res.status).not.toHaveBeenCalled();
		expect(res.send).not.toHaveBeenCalled();
	});
});
