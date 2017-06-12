"use strict";

var setTitle = require('../../../index.js').middleware.setTitle;

/**
 * Test that the setTitle function is properly applied by the setTitle middlware
 */
exports['test setTitle function is properly applied to middleware'] = function (test) {
	var context = {};

	test.ok(typeof(setTitle) === 'function');

	setTitle.call(context, 'a', 'b', 'c', {}, function () {});

	test.equal(typeof(context.setTitle), 'function');
	test.done();
};

/**
 * Test that the title is properly set to the request context
 */
exports['test setTitle function properly updates request context'] = function (test) {
	var context = {};

	test.ok(typeof(setTitle) === 'function');

	setTitle.call(context, 'a', 'b', 'c', {}, function () {});
	context.setTitle('foo');

	test.equal(context._page_title, 'foo');
	test.done();
};