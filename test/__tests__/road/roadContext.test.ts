
import { Road } from '../../../src/index';
import { Context } from '../../../src/core/road';

import { describe, expect, test } from 'vitest';

interface confirmContext {
	confirmString: () => string
}

describe('Road Context', () => {
	/**
	 * Ensure that the request context is the context provided in the Road constructor
	 */
	test('Road Context Persists', () => {
		expect.assertions(1);
		const response_string = 'blahblahwhatwhatwhat';

		const road = new Road();

		road.beforeRoute(function (method, url, body, headers, next) {
			this.confirmString = function () {
				return response_string;
			};

			return next();
		});

		road.addRoute('GET', '/', function (this: Context & confirmContext) {
			return this.confirmString();
		});

		return expect(road.request('GET', '/')).resolves.toEqual({
			status: 200,
			body: response_string,
			headers: {}
		});
	});

	/**
	 * Ensure that the request context is the context provided in the Road constructor
	 */
	test('Road Async Context Persists', () => {
		expect.assertions(1);

		const response_string = 'blahblahwhatwhatwhat';

		const road = new Road();

		road.beforeRoute(async function (method, url, body, headers, next) {
			this.confirmString = function () {
				return response_string;
			};

			return await next();
		});

		road.addRoute('GET', '/', function (this: Context & confirmContext) {
			return this.confirmString();
		});

		return expect(road.request('GET', '/')).resolves.toEqual({
			status: 200,
			body: response_string,
			headers: {}
		});
	});
});