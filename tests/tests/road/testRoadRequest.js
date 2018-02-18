"use strict";

var roads = require('../../../index.js');


/**
 * Ensure that the basic request system lines up
 */
exports.testRequest = function (test) {
	var road = new roads.Road();

	road.request('GET', '/', 'yeah', {
		"one" : "two"
	}).then(function (response) {
		test.deepEqual({
			status: 200,
			headers : {},
			body : undefined
		}, response);

		test.done();
	});
};

/**
 * Ensure that route errors naturally bubble up through the promise catch
 */
exports.testMethodWithError = function (test) {
	var road = new roads.Road();

	road.use(function () {
		throw new Error('huh');
	});

	road.request('GET', '/').then(function (response) {
		// this endpoint should error
		test.ok(false);
		test.done();
	}).catch(function (e) {
		test.equal(e.message, 'huh');
		test.done();
	});
};

/**
 * Ensure that route errors naturally bubble up through the promise catch
 */
exports.testAsyncMethodWithError = function (test) {
	var road = new roads.Road();

	road.use(async function () {
		throw new Error('huh');
	});

	road.request('GET', '/').then(function (response) {
		// this endpoint should error
		test.ok(false);
		test.done();
	}).catch(function (e) {
		test.equal(e.message, 'huh');
		test.done();
	});
};

/**
 * Ensure that a request handler that executes, then calls the actual route returns as expected
 */
exports.testRequestWithMultipleHandlersCalled = function (test) {
	var road = new roads.Road();
	var step1 = false;
	var step2 = false;

	road.use(function (method, url, body, headers, next) {
		step1 = true;
		return next();
	});

	road.use(function (method, url, body, headers, next) {
		step2 = true;
		return next();
	});

	road.request('GET', '/').then(function (response) {
		test.ok(step1);
		test.ok(step2);
		test.done();
	})
	.catch(function (e) {
		console.log(e.stack);
		test.fail();
	});
};

/**
 * Ensure that a request handler that executes, then calls the actual route returns as expected
 */
exports.testRequestErrorWithHandler = function (test) {
	var road = new roads.Road();

	road.use(function (method, url, body, headers, next) {
		return next();
	});//*/

	road.use(function () {
		throw new Error('huh');
	});

	road.request('GET', '/').then(function (response) {
		// this endpoint should error
		test.ok(false);
		test.done();
	}).catch(function (e) {
		test.equal(e.message, 'huh');
		test.done();
	});
};


/**
 * Ensure that a request handler that executes, then calls the actual route returns as expected
 */
exports.testAsyncRequestErrorWithHandler = function (test) {
	var road = new roads.Road();

	road.use(function (method, url, body, headers, next) {
		return next();
	});//*/

	road.use(async function () {
		throw new Error('huh');
	});

	road.request('GET', '/').then(function (response) {
		// this endpoint should error
		test.ok(false);
		test.done();
	}).catch(function (e) {
		test.equal(e.message, 'huh');
		test.done();
	});
};

/**
 * Ensure that you can handle errors properly from the request handler
 */
exports.testRequestErrorWithHandlerThatCatchesErrors = function (test) {
	var road = new roads.Road();

	road.use(function (method, url, body, headers, next) {
		return next()
			.catch(function (error) {
				return {"error" : error.message};
			});
	});//*/

	road.use(function () {
		throw new Error('huh');
	});

	road.request('GET', '/').then(function (response) {
		test.deepEqual(response, {
			status: 200,
			headers : {},
			body : {"error":"huh"}
		});
		test.done();
	});
};