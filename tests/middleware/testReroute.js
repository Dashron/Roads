"use strict";

const reroute = require('../../index.js').middleware.reroute;
var Response = require('../../index.js').Response;

/**
 * Tests that the provided road's request method is bound to the 
 * original road's context under the provided key
 */
exports['test request method is bound to context key'] = function (test) {
	var mockRoad = {
		request: function (method, path, body, headers) {
			return 'banana';
		}
	};
	var key = 'foo';
	var context = {};
	var middleware = reroute(key, mockRoad);

	test.equals(typeof(middleware), 'function');

	var response = middleware.call(context, 'a', 'b', 'c', {}, function () {});

	test.equals(typeof(context[key]), 'function');
	test.equals(context[key](), 'banana');

	test.done();
};