import { Road } from '../../../src/index.js';
import { Context, Middleware } from '../../../src/core/road.js';
import { Response } from '../../../src/index.js';

import { describe, expect, test } from 'vitest';

describe('road request', () => {
	/**
	 * Ensure that the basic request system lines up
	 */
	test('Request', () => {
		expect.assertions(1);
		const road = new Road();

		return expect(road.request('GET', '/', 'yeah', {
			one : 'two'
		})).resolves.toEqual({
			status: 404,
			headers : {},
			body : 'Page not found'
		});
	});

	/**
	 * Ensure that route errors naturally bubble up through the promise catch
	 */
	test('Method With Error', () => {
		expect.assertions(1);
		const road = new Road();

		road.use(function () {
			throw new Error('huh');
		});

		return expect(road.request('GET', '/')).rejects.toEqual(new Error('huh'));
	});

	/**
	 * Ensure that route errors naturally bubble up through the promise catch
	 */
	test('Async Method With Error', () => {
		expect.assertions(1);
		const road = new Road();

		road.use(async function () {
			throw new Error('huh');
		});

		return expect(road.request('GET', '/')).rejects.toEqual(new Error('huh'));
	});

	/**
	 * Ensure that a request handler that executes, then calls the actual route returns as expected
	 */
	test('Request With Multiple Handlers Called', () => {
		expect.assertions(2);
		const road = new Road();
		let step1 = false;
		let step2 = false;

		road.use(function (method, url, body, headers, next) {
			step1 = true;
			return next();
		});

		road.use(function (method, url, body, headers, next) {
			step2 = true;
			return next();
		});

		return road.request('GET', '/').then(function () {
			expect(step1).toEqual(true);
			expect(step2).toEqual(true);
		});
	});

	/**
	 * Ensure that a request handler that executes, then calls the actual route returns as expected
	 */
	test('Request Error With Handler', () => {
		expect.assertions(1);

		const road = new Road();

		road.use(function (method, url, body, headers, next) {
			return next();
		});

		road.use(function () {
			throw new Error('huh');
		});

		return expect(road.request('GET', '/')).rejects.toEqual(new Error('huh'));
	});


	/**
	 * Ensure that a request handler that executes, then calls the actual route returns as expected
	 */
	test('Async Request Error With Handler', () => {
		expect.assertions(1);

		const road = new Road();

		road.use(function (method, url, body, headers, next) {
			return next();
		});

		road.use(async function () {
			throw new Error('huh');
		});

		return expect(road.request('GET', '/')).rejects.toEqual(new Error('huh'));
	});

	/**
	 * Ensure that you can handle errors properly from the request handler
	 */
	test('Request Error With Handler That Catches Errors', () => {
		expect.assertions(1);
		const road = new Road();

		const middleware: Middleware<Context> = function (method, url, body, headers, next) {
			return next()
				.catch(function (error: Error) {
					return new Response(JSON.stringify({error : error.message}), 200);
				});
		};

		road.use(middleware);

		road.use(function () {
			throw new Error('huh');
		});

		return expect(road.request('GET', '/')).resolves.toEqual({
			status: 200,
			headers : {},
			body : '{"error":"huh"}'
		});
	});

	/**
	 * Ensure that calling next twice re-runs the rest of the chain instead of running off the end
	 */
	test('First Handler Calling Next Twice Reruns The Rest Of The Chain', () => {
		expect.assertions(3);
		const road = new Road();
		let step2 = 0;
		let step3 = 0;

		road.use(async function (method, url, body, headers, next) {
			await next();
			return next();
		});

		road.use(function (method, url, body, headers, next) {
			step2 += 1;
			return next();
		});

		road.use(function () {
			step3 += 1;
			return 'done';
		});

		return road.request('GET', '/').then(function (response) {
			expect(step2).toEqual(2);
			expect(step3).toEqual(2);
			expect(response).toEqual({
				status: 200,
				headers : {},
				body : 'done'
			});
		});
	});

	/**
	 * Ensure that calling next twice from the middle of the chain doesn't skip the following handler
	 */
	test('Middle Handler Calling Next Twice Does Not Skip Handlers', () => {
		expect.assertions(4);
		const road = new Road();
		let step1 = 0;
		let step3 = 0;
		let step4 = 0;

		road.use(function (method, url, body, headers, next) {
			step1 += 1;
			return next();
		});

		road.use(async function (method, url, body, headers, next) {
			await next();
			return next();
		});

		road.use(function (method, url, body, headers, next) {
			step3 += 1;
			return next();
		});

		road.use(function () {
			step4 += 1;
			return 'done';
		});

		return road.request('GET', '/').then(function (response) {
			expect(step1).toEqual(1);
			expect(step3).toEqual(2);
			expect(step4).toEqual(2);
			expect(response).toEqual({
				status: 200,
				headers : {},
				body : 'done'
			});
		});
	});

	/**
	 * Ensure that concurrent calls to next each run the rest of the chain
	 */
	test('Handler Calling Next Concurrently Runs The Rest Of The Chain Each Time', () => {
		expect.assertions(3);
		const road = new Road();
		let step2 = 0;
		let step3 = 0;

		road.use(async function (method, url, body, headers, next) {
			const results = await Promise.all([next(), next()]);
			return results[1];
		});

		road.use(function (method, url, body, headers, next) {
			step2 += 1;
			return next();
		});

		road.use(function () {
			step3 += 1;
			return 'done';
		});

		return road.request('GET', '/').then(function (response) {
			expect(step2).toEqual(2);
			expect(step3).toEqual(2);
			expect(response).toEqual({
				status: 200,
				headers : {},
				body : 'done'
			});
		});
	});

	/**
	 * Ensure that middleware always receives lower-case header names
	 */
	test('Request Header Names Are Lower-Cased', () => {
		expect.assertions(1);
		const road = new Road();

		road.use(function (method, url, body, headers) {
			return JSON.stringify(headers);
		});

		return expect(road.request('GET', '/', undefined, {
			'Content-Type': 'text/plain',
			'X-Custom': ['a', 'b']
		})).resolves.toEqual({
			status: 200,
			headers : {},
			body : '{"content-type":"text/plain","x-custom":["a","b"]}'
		});
	});

	/**
	 * Ensure that response header names are lower-cased, and that names differing only by case are merged
	 */
	test('Response Header Names Are Lower-Cased And Merged', () => {
		expect.assertions(1);
		const road = new Road();

		road.use(function () {
			return new Response('done', 200, {
				'Content-Type': 'text/plain',
				'set-cookie': 'a=1',
				'Set-Cookie': ['b=2']
			});
		});

		return expect(road.request('GET', '/')).resolves.toEqual({
			status: 200,
			headers : {
				'content-type': 'text/plain',
				'set-cookie': ['a=1', 'b=2']
			},
			body : 'done'
		});
	});
});
