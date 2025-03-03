/* eslint-disable @typescript-eslint/no-explicit-any */
import {  middleware } from '../../../src/middleware/parseBody';

import { Context } from '../../../src/core/road';
import { Road } from '../../../src/index';
import Response from '../../../src/core/response';

import { describe, expect, test, assert } from 'vitest';
import { Route } from '../../../src/core/router';

describe('Parse Request Body tests', () => {
	test('test request with valid json body', () => {
		expect.assertions(1);
		const context: Record<string, any> = {};
		const body = '{"hello": "there"}';

		// eslint-disable-next-line @typescript-eslint/no-empty-function
		middleware.call(context, '', '', body, {'content-type': 'application/json'}, () => {});
		expect(context.body).toEqual({hello: 'there'});
	});

	/**
     * Test that valid json parsing works as expected
     */
	test('test request with invalid json body', () => {
		expect.assertions(2);
		const context: Record<string, any> = {};
		const body = '{hello ';

		// eslint-disable-next-line @typescript-eslint/no-empty-function
		const response = middleware.call(context, '', '', body, {'content-type': 'application/json'}, () => {
			assert.fail('Next should not be called if the request body can not be parsed');
		});

		expect(context.body).toBe(undefined);
		expect(response).toEqual({
			status: 400,
			headers: {},
			body: 'Invalid request body',
		});
	});

	/**
     * Test that valid json parsing works as expected with roads
     */
	test('test used request with valid json body', () => {
		expect.assertions(1);

		const road = new Road();
		road.beforeRoute(middleware);
		const body = '{"hello": "there"}';

		const middleware2: Route<Context> = function () {
			expect(this.body).toEqual({hello: 'there'});
			return Promise.resolve(new Response(''));
		};

		road.addRoute('GET', '/', middleware2);

		return road.request('GET', '/', body, {
			'content-type' : 'application/json'
		});
	});

	/**
     * Test that invalid json parsing fails as expected with roads
     */
	test('test used request with invalid json body', () => {
		expect.assertions(1);
		const road = new Road();
		road.addRoute('GET', '/', middleware);
		const body = '{hello there';

		return expect(road.request('GET', '/', body, {
			'content-type' : 'application/json'
		})).resolves.toEqual({
			status: 400,
			headers: {},
			body: 'Invalid request body',
		});
	});


	/**
     * Test that the content type can contain parameters
     */
	test('test content type with parameters', () => {
		expect.assertions(1);
		const context: Record<string, any> = {};
		const body = '{"hello": "there"}';

		// eslint-disable-next-line @typescript-eslint/no-empty-function
		middleware.call(context, '', '', body, {'content-type': 'application/json; charset=utf-8'}, () => {});
		expect(context.body).toEqual({hello: 'there'});
	});

	// You can only have one content type for a request. Commas are not allowed.
	test('test weird content-type', () => {
		expect.assertions(1);
		const context: Record<string, any> = {};
		const body = '{"hello": "there"}';

		// eslint-disable-next-line @typescript-eslint/no-empty-function
		expect(middleware.call(context, '', '', body, {
			'content-type': 'text/html,application/x-www-form-urlencoded'
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		}, () => {})).toEqual({
			status: 400,
			headers: {},
			body: 'Invalid content-type header',
		});
	});
});