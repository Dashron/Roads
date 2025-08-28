/* eslint-disable @typescript-eslint/no-explicit-any */
import {  middleware } from '../../../src/middleware/parseBody';

import { Context, Middleware as MiddlewareType } from '../../../src/core/road';
import { Road } from '../../../src/index';
import Response from '../../../src/core/response';

import { describe, expect, test, assert } from 'vitest';

describe('Parse Request Body tests', () => {
	test('test request with valid json body', () => {
		expect.assertions(1);
		const context: Record<string, any> = {};
		const body = '{"hello": "there"}';


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
		road.use(middleware);
		const body = '{"hello": "there"}';

		const middleware2: MiddlewareType<Context> = function () {
			expect(this.body).toEqual({hello: 'there'});
			return Promise.resolve(new Response(''));
		};

		road.use(middleware2);

		road.request('', '', body, {
			'content-type' : 'application/json'
		});
	});

	/**
     * Test that invalid json parsing fails as expected with roads
     */
	test('test used request with invalid json body', () => {
		expect.assertions(1);
		const road = new Road();
		road.use(middleware);
		const body = '{hello there';

		return expect(road.request('', '', body, {
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


		middleware.call(context, '', '', body, {'content-type': 'application/json; charset=utf-8'}, () => {});
		expect(context.body).toEqual({hello: 'there'});
	});

	// You can only have one content type for a request. Commas are not allowed.
	test('test weird content-type', () => {
		expect.assertions(1);
		const context: Record<string, any> = {};
		const body = '{"hello": "there"}';


		expect(middleware.call(context, '', '', body, {
			'content-type': 'text/html,application/x-www-form-urlencoded'

		}, () => {})).toEqual({
			status: 400,
			headers: {},
			body: 'Invalid content-type header',
		});
	});

	test('test form-encoded body parsing', () => {
		expect.assertions(1);
		const context: Record<string, any> = {};
		const body = 'name=John&age=30';

		middleware.call(context, '', '', body, {'content-type': 'application/x-www-form-urlencoded'}, () => {});
		expect(context.body).toEqual({name: 'John', age: '30'});
	});

	test('test array content-type header uses first value', () => {
		expect.assertions(1);
		const context: Record<string, any> = {};
		const body = '{"hello": "there"}';

		middleware.call(context, '', '', body, {
			'content-type': ['application/json', 'text/plain']
		}, () => {});
		expect(context.body).toEqual({hello: 'there'});
	});

	test('test unknown content-type returns literal body', () => {
		expect.assertions(1);
		const context: Record<string, any> = {};
		const body = 'raw text content';

		middleware.call(context, '', '', body, {'content-type': 'text/plain'}, () => {});
		expect(context.body).toBe('raw text content');
	});

	test('test no content-type returns literal body', () => {
		expect.assertions(1);
		const context: Record<string, any> = {};
		const body = 'raw text content';

		middleware.call(context, '', '', body, {}, () => {});
		expect(context.body).toBe('raw text content');
	});
});