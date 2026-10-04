import { middleware, ParseBodyContext } from '../../../src/middleware/parseBody.js';

import { Context, IncomingHeaders, Middleware as MiddlewareType } from '../../../src/core/road.js';
import { NextOverrides } from '../../../src/core/requestChain.js';
import { Road } from '../../../src/index.js';
import Response from '../../../src/core/response.js';

import { describe, expect, test, assert } from 'vitest';

/**
 * Calls the middleware directly and returns what it sent to next, along with the context and response.
 * 	`overrides` is undefined if next was never called
 */
function callMiddleware (body: string | undefined, headers: IncomingHeaders | undefined) {
	const context = {} as ParseBodyContext;
	let overrides: NextOverrides | undefined;

	const response = middleware.call(context, '', '', body, headers, (nextOverrides) => {
		overrides = nextOverrides;
		return Promise.resolve('');
	});

	return { context, overrides, response };
}

describe('Parse Request Body tests', () => {
	test('test request with valid json body', () => {
		expect.assertions(1);

		const { overrides } = callMiddleware('{"hello": "there"}', {'content-type': 'application/json'});

		expect(overrides).toEqual({ body: {hello: 'there'} });
	});

	test('test the raw body is kept on the context', () => {
		expect.assertions(1);

		const { context } = callMiddleware('{"hello": "there"}', {'content-type': 'application/json'});

		expect(context.rawBody).toEqual('{"hello": "there"}');
	});

	/**
     * Test that valid json parsing works as expected
     */
	test('test request with invalid json body', () => {
		expect.assertions(2);
		const context = {} as ParseBodyContext;
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
	test('test used request with valid json body', async () => {
		expect.assertions(3);

		const road = new Road();
		road.use(middleware);
		const body = '{"hello": "there"}';

		const middleware2: MiddlewareType<ParseBodyContext> = function (method, url, parsedBody) {
			expect(parsedBody).toEqual({hello: 'there'});
			expect(this.rawBody).toEqual(body);
			// The parsed body is no longer added to the context
			expect(this.body).toBe(undefined);
			return Promise.resolve(new Response(''));
		};

		road.use(middleware2);

		await road.request('', '', body, {
			'content-type' : 'application/json'
		});
	});

	/**
     * Test that middleware added before the parser still receives the body as a string
     */
	test('test middleware before the parser receives the string body', async () => {
		expect.assertions(1);

		const road = new Road();
		const body = '{"hello": "there"}';

		const before: MiddlewareType<Context> = function (method, url, stringBody, headers, next) {
			expect(stringBody).toEqual(body);
			return next();
		};

		road.use(before);
		road.use(middleware);
		road.use(() => '');

		await road.request('', '', body, {
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

		const { overrides } = callMiddleware('{"hello": "there"}', {'content-type': 'application/json; charset=utf-8'});

		expect(overrides).toEqual({ body: {hello: 'there'} });
	});

	// You can only have one content type for a request. Commas are not allowed.
	test('test weird content-type', () => {
		expect.assertions(2);

		const { overrides, response } = callMiddleware('{"hello": "there"}', {
			'content-type': 'text/html,application/x-www-form-urlencoded'
		});

		expect(overrides).toBe(undefined);
		expect(response).toEqual({
			status: 400,
			headers: {},
			body: 'Invalid content-type header',
		});
	});

	test('test form-encoded body parsing', () => {
		expect.assertions(1);

		const { overrides } = callMiddleware('name=John&age=30', {'content-type': 'application/x-www-form-urlencoded'});

		expect(overrides).toEqual({ body: {name: 'John', age: '30'} });
	});

	test('test array content-type header uses first value', () => {
		expect.assertions(1);

		const { overrides } = callMiddleware('{"hello": "there"}', {
			'content-type': ['application/json', 'text/plain']
		});

		expect(overrides).toEqual({ body: {hello: 'there'} });
	});

	test('test unknown content-type returns literal body', () => {
		expect.assertions(1);

		const { overrides } = callMiddleware('raw text content', {'content-type': 'text/plain'});

		expect(overrides).toEqual({ body: 'raw text content' });
	});

	test('test no content-type returns literal body', () => {
		expect.assertions(1);

		const { overrides } = callMiddleware('raw text content', {});

		expect(overrides).toEqual({ body: 'raw text content' });
	});

	test('test no body passes along undefined', () => {
		expect.assertions(1);

		const { overrides } = callMiddleware(undefined, {'content-type': 'application/json'});

		expect(overrides).toEqual({ body: undefined });
	});

	test('test handles non-Error thrown objects safely', () => {
		expect.assertions(1);
		const context = {} as ParseBodyContext;
		const body = '{"hello": "there"}';

		// Mock JSON.parse to throw a non-Error object
		const originalParse = JSON.parse;
		JSON.parse = () => {
			throw 'string error'; // Not an Error object
		};

		const response = middleware.call(context, '', '', body, {'content-type': 'application/json'}, () => {
			assert.fail('Next should not be called if the request body can not be parsed');
		});

		// Restore JSON.parse
		JSON.parse = originalParse;

		expect(response).toEqual({
			status: 400,
			headers: {},
			body: 'Invalid request body',
		});
	});
});
