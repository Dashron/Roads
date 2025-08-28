/* eslint-disable @typescript-eslint/no-explicit-any */

import { build } from '../../../src/middleware/reroute';
import Road from '../../../src/core/road';
import { Context, Middleware as MiddlewareType } from '../../../src/core/road';
import Response from '../../../src/core/response';

import { describe, expect, test } from 'vitest';

describe('Reroute middleware tests', () => {
	/**
	 * Tests that the provided road's request method is bound to the
	 * original road's context under the provided key
	 */
	test('test request method is bound to context key', () => {
		expect.assertions(3);

		const request: MiddlewareType<Context> = function () {
			return Promise.resolve(new Response('banana'));
		};

		const mockRoad = {
			request: request
		};
		const key = 'foo';
		const context: Record<string, any> = {};
		const middleware = build(key, mockRoad as Road);

		expect(typeof(middleware)).toEqual('function');


		middleware.call(context, 'a', 'b', 'c', {}, function () {});

		expect(typeof(context[key])).toEqual('function');
		return expect(context[key]()).resolves.toEqual(new Response('banana'));
	});
});