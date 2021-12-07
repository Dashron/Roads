/* eslint-disable @typescript-eslint/no-explicit-any */

import { build } from '../../../middleware/reroute';
import Road from '../../../core/road';
import { Context, Middleware as MiddlewareType } from '../../../core/road';
import Response from '../../../core/response';

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

		// eslint-disable-next-line @typescript-eslint/no-empty-function
		middleware.call(context, 'a', 'b', 'c', {}, function () {});

		expect(typeof(context[key])).toEqual('function');
		return expect(context[key]()).resolves.toEqual(new Response('banana'));
	});
});