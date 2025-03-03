import { Road } from '../../../src/index';
import { Context, Middleware } from '../../../src/core/road';
import { Response } from '../../../src/index';

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

		road.addRoute('GET', '/', function () {
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

		road.addRoute('GET', '/', async function () {
			throw new Error('huh');
		});

		return expect(road.request('GET', '/')).rejects.toEqual(new Error('huh'));
	});

	/**
	 * Ensure that
	 */
	test('Only a single route attched to a method/path pairing is executed', async () => {
		expect.assertions(3);
		const road = new Road();
		let step1 = false;
		let step2 = false;

		road.addRoute('GET', '/', function () {
			step1 = true;
			return 'first';
		});

		road.addRoute('GET', '/', function () {
			step2 = true;
			return 'second';
		});

		const response = await road.request('GET', '/');
		expect(step1).toEqual(true);
		expect(step2).toEqual(false);
		expect(response).toEqual(new Response('first', 200));
	});

	/**
	 * Ensure that a request handler that executes, then calls the actual route returns as expected
	 */
	test('Request Error With Handler', () => {
		expect.assertions(1);

		const road = new Road();

		road.addRoute('GET', '/', function (method, url, body, headers, next) {
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

		const middleware: Route<Context> = function (method, url, body, headers, next) {
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
});