"use strict";

const reroute = require('../../../src/index.js').middleware.reroute;

describe('Reroute middleware tests', () => {
	/**
	 * Tests that the provided road's request method is bound to the 
	 * original road's context under the provided key
	 */
	test('test request method is bound to context key', () => {
		expect.assertions(3);

		var mockRoad = {
			request: function (method, path, body, headers) {
				return 'banana';
			}
		};
		var key = 'foo';
		var context = {};
		var middleware = reroute(key, mockRoad);

		expect(typeof(middleware)).toEqual('function');

		middleware.call(context, 'a', 'b', 'c', {}, function () {});

		expect(typeof(context[key])).toEqual('function');
		expect(context[key]()).toEqual('banana');
	});
});