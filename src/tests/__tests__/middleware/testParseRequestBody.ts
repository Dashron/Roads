/* eslint-disable @typescript-eslint/no-explicit-any */
import {  middleware } from '../../../middleware/parseBody';

import { Context, Middleware as MiddlewareType } from '../../../core/road';
import { Road } from '../../../index';
import Response from '../../../core/response';

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
			fail('Next should not be called if the request body can not be parsed');
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

		// eslint-disable-next-line @typescript-eslint/no-empty-function
		middleware.call(context, '', '', body, {'content-type': 'application/json; charset=utf-8'}, () => {});
		expect(context.body).toEqual({hello: 'there'});
	});
});