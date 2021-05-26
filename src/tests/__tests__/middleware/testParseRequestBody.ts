/* eslint-disable @typescript-eslint/no-explicit-any */
import { parseBodyMiddleware } from '../../../middleware/parseBody';

import { Context, Middleware as MiddlewareType } from '../../../core/road';
import { Road } from '../../../index';
import Response from '../../../core/response';

describe('Parse Request Body tests', () => {
	test('test request with valid json body', () => {
		expect.assertions(1);
		const context: {[X: string]: any} = {};
		const body = '{"hello": "there"}';

		// eslint-disable-next-line @typescript-eslint/no-empty-function
		parseBodyMiddleware.call(context, '', '', body, {'content-type': 'application/json'}, () => {});
		expect(context.body).toEqual({hello: 'there'});
	});

	/**
     * Test that valid json parsing works as expected
     */
	test('test request with invalid json body', () => {
		expect.assertions(1);
		const context = {};
		const body = '{hello ';

		return expect(() => {
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			return parseBodyMiddleware.call(context, '', '', body, {'content-type': 'application/json'}, () => {});
		}).toThrowError();
	});

	/**
     * Test that valid json parsing works as expected with roads
     */
	test('test used request with valid json body', () => {
		expect.assertions(1);

		const road = new Road();
		road.use(parseBodyMiddleware);
		const body = '{"hello": "there"}';

		const middleware: MiddlewareType<Context> = function () {
			expect(this.body).toEqual({hello: 'there'});
			return Promise.resolve(new Response(''));
		};

		road.use(middleware);

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
		road.use(parseBodyMiddleware);
		const body = '{hello there';

		return expect(road.request('', '', body, {
			'content-type' : 'application/json'
		})).rejects.toEqual(new Error('Unexpected token h in JSON at position 1'));
	});


	/**
     * Test that the content type can contain parameters
     */
	test('test content type with parameters', () => {
		expect.assertions(1);
		const context: {[X: string]: any} = {};
		const body = '{"hello": "there"}';

		// eslint-disable-next-line @typescript-eslint/no-empty-function
		parseBodyMiddleware.call(context, '', '', body, {'content-type': 'application/json; charset=utf-8'}, () => {});
		expect(context.body).toEqual({hello: 'there'});
	});
});