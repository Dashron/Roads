"use strict";

const applyToContext = require('../../../index.js').middleware.applyToContext;

/**
 * Test that applyToContext actually applies the value properly
 */
exports['test apply to context applies context'] = function (test) {
	var key = 'foo';
	var val = 'bar';
	var context = {};

	var fn = applyToContext(key, val);
	test.ok(typeof(fn) === 'function');

	fn.call(context, 'a', 'b', 'c', 'd', function () {});

	test.equal(context[key], val);
	test.done();
};

/**
 * Test that applyToContext will execute the next method and continue to the next function
 */
exports['test apply to context calls next'] = function (test) {
	var key = 'foo';
	var val = 'bar';
	var context = {};

	var fn = applyToContext(key, val);
	test.ok(typeof(fn) === 'function');

	var custom = fn.call(context, 'a', 'b', 'c', 'd', function () {
		return 'custom data';
	});

	test.equal(custom, 'custom data');
	test.done();
};