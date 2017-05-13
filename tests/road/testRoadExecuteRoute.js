"use strict";

var roads = require('../../index.js');
var url_module = require('url');

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
 * Test that route execution of an async function becomes a proper promise
 */
exports.testExecuteAsyncRoute = function (test) {
	var road = new roads.Road();
	var result = 'stuff stuff stuff';

	// todo: eventually switch to async functions
	road._executeRoute(async function () {
		return result;
	}).then(function (real_result) {
		test.equals(result, real_result);
		test.done();
	}).catch(function (e) {
		test.ok(false);
		test.done();
	});
};

/**
 * Test that route execution of an async function, which throws an exception, becomes a proper promise
 */
exports.testExecuteErrorAsyncRoute = function (test) {
	var road = new roads.Road();

	// todo: eventually switch to async functions
	var cr = async function () {
		throw new Error('random messageeeeeeeeeee');
		await new roads.Promise(function (resolve) { resolve() });
	};

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