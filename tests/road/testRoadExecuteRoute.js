"use strict";

var roads = require('../../index.js');
var url_module = require('url');
var coroutine = require('roads-coroutine');

/**
 * Test that route execution of a normal function becomes a proper promise
 */
exports.testExecuteRoute = function (test) {
	var road = new roads.Road();
	var result = 'all the things';

	road._executeRoute(function () {
		return result;
	}).then(function (real_result) {
		test.equals(result, real_result);
		test.done();
	}).catch(function (e) {
		// this should never happen
		test.ok(false);
		test.done();
	});
};

/**
 * Test that route execution of a normal function, which throws an exception, becomes a proper promise
 */
exports.testExecuteErrorRoute = function (test) {
	var road = new roads.Road();
	var err = new Error();

	road._executeRoute(function () {
		throw err;
	}).then(function (result) {
		test.ok(false);
		test.done();
	}).catch(function (e) {
		test.equals(err, e);
		test.done();
	});
};

/**
 * Test that route execution of a coroutine becomes a proper promise
 */
exports.testExecuteCoroutineRoute = function (test) {
	var road = new roads.Road();
	var result = 'stuff stuff stuff';

	// todo: eventually switch to async functions
	road._executeRoute(coroutine(function* () {
		return result;
	})).then(function (real_result) {
		test.equals(result, real_result);
		test.done();
	}).catch(function (e) {
		test.ok(false);
		test.done();
	});
};

/**
 * Test that route execution of a coroutine, which throws an exception, becomes a proper promise
 */
exports.testExecuteErrorCoroutineRoute = function (test) {
	var road = new roads.Road();

	// todo: eventually switch to async functions
	var cr = coroutine(function* () {
		throw new Error('random messageeeeeeeeeee');
		yield new roads.Promise(function (resolve) { resolve() });
	});

	var response = road._executeRoute(cr);
	test.ok(response instanceof roads.Promise);

	response.then(function (result) {
		test.ok(false);
		test.done();
	}, function (e) {
		test.equal('random messageeeeeeeeeee', e.message);
		test.done();
	});
};