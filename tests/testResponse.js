"use strict";

var roads = require('../index');
var url_module = require('url');

/**
 * Test that getData with a promise is still the original promise
 */
exports.testPromiseGetData = function (test) {
	var response_data = {
		message : "hello"
	};

	var promise = new roads.Promise(function (resolve, reject) {
		resolve(response_data);
	});

	var res = new roads.Response(promise);
	test.equal(promise, res.data);
	test.done();
};

/**
 * Test that getData with a non promise is translated into a promise
 */
exports.testGetObjectData = function (test) {
	var response_data = {
		message : "hello"
	};

	var res = new roads.Response(response_data);

	test.equal(response_data, res.data);
	test.done();
};

/**
 * Test that a response built around a promise is thenable, and returns the original data
 */
exports.testGetDataIsThenable = function (test) {
	var response_data = {
		message : "hello"
	};

	var promise = new roads.Promise(function (resolve, reject) {
		resolve(response_data);
	});

	var res = new roads.Response(promise);

	res.data.then(function (data) {
		test.equal(data, response_data);
		test.done();
	});
};

/**
 * Ensure that a response built around direct data (not a promise) becomes a promise, is thenable, and returns the original data
 */
exports.testNonPromiseGetData = function (test) {
	var response_data = {
		message : "hello"
	};

	var res = new roads.Response(response_data);

	test.equal(res.data, response_data);
	test.done();
};