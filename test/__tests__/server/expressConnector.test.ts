import { Road, RoadsResponse, expressConnector } from '../../../src/index.js';

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

	test.each([[undefined], [{}], [{ name: 'dashron' }]])('a non-string body becomes undefined - %j', async (body) => {
		// Express leaves req.body as undefined or an object when no body parser handled the request
		let received: unknown = 'unset';
		const road = new Road();
		road.use(async function (method, path, requestBody) {
			received = requestBody;
			return 'ok';
		});

		await expressConnector(road)(buildReq(body), buildRes(), vi.fn());

		expect(received).toBeUndefined();
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
