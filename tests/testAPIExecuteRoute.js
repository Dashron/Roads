"use strict";

var Resource = require('../lib/resource');
var API = require('../lib/api');
var url_module = require('url');
var Promise = require('bluebird');

/**
 * Create a mock resource
 * 
 * @param  {[type]} methods   [description]
 * @param  {[type]} resources [description]
 * @return {[type]}           [description]
 */
function createResource (methods, resources) {
	var endpoint = function (method) {
		return function* (url, body, headers) {
			return {
				path : url.path,
				method : method,
				body : body,
				headers : headers
			};
		};
	};

	var definition = {
		methods : {
		}
	};

	if (methods) {
		methods.forEach(function (method) {
			definition.methods[method] = endpoint(method);
		});
	}

	if (resources) {
		definition.resources = resources;
	}

	return new Resource(definition);
}

/**
 * Test that route execution of a normal function becomes a proper promise
 */
exports.testExecuteRoute = function (test) {
	var resource = createResource(['GET']);
	var api = new API(resource);
	var result = 'all the things';

	api._executeRoute(function () {
		return result;
	}, '', '', '', '').then(function (real_result) {
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
	var resource = createResource(['GET']);
	var api = new API(resource);
	var err = new Error();

	api._executeRoute(function () {
		throw err;
	}, '', '', '', '').then(function (result) {
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
	var resource = createResource(['GET']);
	var api = new API(resource);
	var result = 'stuff stuff stuff';

	api._executeRoute(Promise.coroutine(function* () {
		return result;
	}), '', '', '', '').then(function (real_result) {
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
	var resource = createResource(['GET']);
	var api = new API(resource);
	var err = new Error();

	api._executeRoute(Promise.coroutine(function* () {
		throw err;
	}), '', '', '', '').then(function (result) {
		test.ok(false);
		test.done();
	}).catch(function (e) {
		test.equal(err, e);
		test.done();
	});
};