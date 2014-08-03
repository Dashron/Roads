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
 * Ensure that the basic request system lines up
 */
exports.testRequest = function (test) {
	var resource = createResource(['GET']);

	var api = new API(resource);

	api.request('GET', '/', 'yeah', {
		"one" : "two"
	}).then(function (response) {
		test.deepEqual(response, {
			path : '/',
			method : 'GET',
			body : 'yeah',
			headers : {
				'one' : 'two'
			}
		});

		test.done();
	});
};

/**
 * Ensure that the sub routes line up for strings
 * 
 * @param  {[type]} test [description]
 * @return {[type]}      [description]
 */
exports.testStringSubRequest = function (test) {
	var sub_resource = createResource(['GET']);
	var sub_resource2 = createResource(['GET']);

	var resource = createResource(['GET'], {
		'#test' : sub_resource,
		'$stuff' : sub_resource2
	});

	var api = new API(resource);

	api.request('GET', '/huh', 'yeah', {
		"one" : "two"
	}).then(function (response) {
		test.deepEqual(response, {
			path : '/huh',
			method : 'GET',
			body : 'yeah',
			headers : {
				'one' : 'two'
			}
		});

		test.done();
	});
};

/**
 * Ensure that the sub routes line up for numbers
 * 
 * @param  {[type]} test [description]
 * @return {[type]}      [description]
 */
exports.testNumberSubRequest = function (test) {
	var sub_resource = createResource(['GET']);
	var sub_resource2 = createResource(['GET']);

	var resource = createResource(['GET'], {
		'#test' : sub_resource,
		'$stuff' : sub_resource2
	});

	var api = new API(resource);

	api.request('GET', '/1234', 'yeah', {
		"one" : "two"
	}).then(function (response) {
		test.deepEqual(response, {
			path : '/1234',
			method : 'GET',
			body : 'yeah',
			headers : {
				'one' : 'two'
			}
		});

		test.done();
	});
};

/**
 * Ensure that we get proper errors for invalid path requests
 * 
 * @param  {[type]} test [description]
 * @return {[type]}      [description]
 */
exports.testMissingPathRequest = function (test) {
	var resource = createResource(['GET']);

	var api = new API(resource);

	api.request('GET', '/huh', 'yeah', {
		"one" : "two"
	}).then(function (response) {
		// this endpoint should error
		test.ok(false);
		test.done();
	}).catch(function (e) {
		test.equal(e.code, 404);
		test.equal(e.message, '/huh');
		test.done();
	});
};

/**
 * Ensure that we get proper errors for invalid HTTP methods
 * 
 * @param  {[type]} test [description]
 * @return {[type]}      [description]
 */
exports.testMissingMethodRequest = function (test) {
	var resource = createResource(['GET']);

	var api = new API(resource);

	api.request('POST', '/', 'yeah', {
		"one" : "two"
	}).then(function (response) {
		// this endpoint should error
		test.ok(false);
		test.done();
	}).catch(function (e) {
		test.equal(e.code, 405);
		test.deepEqual(e.message, ['GET']);
		test.done();
	});
};

/**
 * Ensure that the basic request system lines up
 */
exports.testRequestWithHandlerCalled = function (test) {
	var resource = createResource(['GET']);
	var extra = {"extra": "data"};

	var api = new API(resource);
	api.onRequest(function (url, body, headers, next) {
		return next(extra);
	});//*/

	api.request('GET', '/', 'yeah', {
		"one" : "two"
	}).then(function (response) {
		test.deepEqual(response, {
			path : '/',
			method : 'GET',
			body : 'yeah',
			headers : {
				'one' : 'two'
			}
		});

		test.done();
	});
};

/**
 * Ensure that the basic request system lines up
 */
exports.testRequestWithHandlerNotCalled = function (test) {
	var resource = createResource(['GET']);
	var api = new API(resource);
	var response = {"stuff" : "what"};

	api.onRequest(function (url, body, headers, next) {
		return response;
	});//*/

	api.request('GET', '/', 'yeah', {
		"one" : "two"
	}).then(function (new_response) {
		test.equals(response, new_response);
		test.done();
	});
};