"use strict";

import reroute from '../../../middleware/reroute';
import Road, { Middleware } from '../../../road';
import Response from '../../../response';

describe('Reroute middleware tests', () => {
	/**
	 * Tests that the provided road's request method is bound to the 
	 * original road's context under the provided key
	 */
	test('test request method is bound to context key', () => {
		expect.assertions(3);
		
		let request: Middleware;
		request = function (method, path, body, headers) {
			return Promise.resolve(new Response('banana'));
		};

		var mockRoad = {
			request: request
		};
		var key = 'foo';
		var context: { [x: string ]: any };
		context = {};
		var middleware = reroute(key, mockRoad as Road);

		expect(typeof(middleware)).toEqual('function');

		middleware.call(context, 'a', 'b', 'c', {}, function () {});

		expect(typeof(context[key])).toEqual('function');
		return expect(context[key]()).resolves.toEqual(new Response('banana'));
	});
});