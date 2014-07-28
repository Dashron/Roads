var Response = require('../lib/response');
var url_module = require('url');
var Promise = require('bluebird');

/**
 * Test that getData with a promise is still the original promise
 */
exports.testPromiseGetData = function (test) {
	var response_data = {
		message : "hello"
	};

	var promise = new Promise(function (resolve, reject) {
		resolve(response_data);
	});

	var res = new Response(promise);

	test.equal(promise, res.getData());
	test.done();
};

/**
 * Test that getData with a non promise is translated into a promise
 */
exports.testPromiseGetData = function (test) {
	var response_data = {
		message : "hello"
	};

	var res = new Response(response_data);

	test.true(response_data, res.getData());
	test.done();
};

/**
 * Test that a response built around a promise is thenable, and returns the original data
 */
exports.testPromiseGetData = function (test) {
	var response_data = {
		message : "hello"
	};

	var promise = new Promise(function (resolve, reject) {
		resolve(response_data);
	});

	var res = new Response(promise);

	res.getData().then(function (data) {
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

	var res = new Response(response_data);

	res.getData().then(function (data) {
		test.equal(data, response_data);
		test.done();
	});
};