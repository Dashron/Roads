"use strict";

var roads = require('../../index.js');
var url_module = require('url');


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

	return new roads.Resource(definition);
}

/**
 * Ensure that the basic request system lines up
 */
exports.testRequest = function (test) {
	var resource = createResource(['GET']);

	var road = new roads.Road(resource);

	road.request('GET', '/', 'yeah', {
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
 */
exports.testStringSubRequest = function (test) {
	var sub_resource = createResource(['GET']);
	var sub_resource2 = createResource(['GET']);

	var resource = createResource(['GET'], {
		'#test' : sub_resource,
		'$stuff' : sub_resource2
	});

	var road = new roads.Road(resource);

	road.request('GET', '/huh', 'yeah', {
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
 */
exports.testNumberSubRequest = function (test) {
	var sub_resource = createResource(['GET']);
	var sub_resource2 = createResource(['GET']);

	var resource = createResource(['GET'], {
		'#test' : sub_resource,
		'$stuff' : sub_resource2
	});

	var road = new roads.Road(resource);

	road.request('GET', '/1234', 'yeah', {
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
 */
exports.testMissingPathRequest = function (test) {
	var resource = createResource(['GET']);

	var road = new roads.Road(resource);

	road.request('GET', '/huh', 'yeah', {
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
 * Ensure that route errors naturally bubble up through the promise catch
 */
exports.testMethodWithError = function (test) {
	var resource = new roads.Resource({
		methods : {
			GET : function () {
				throw new Error('huh');
			}
		}
	});

	var road = new roads.Road(resource);

	road.request('GET', '/', 'yeah', {
		"one" : "two"
	}).then(function (response) {
		// this endpoint should error
		test.ok(false);
		test.done();
	}).catch(function (e) {
		test.equal(e.message, 'huh');
		test.done();
	});
};

/**
 * Ensure that we get proper errors for invalid HTTP methods
 */
exports.testMissingMethodRequest = function (test) {
	var resource = createResource(['GET']);

	var road = new roads.Road(resource);

	road.request('POST', '/', 'yeah', {
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
 * Ensure that a request handler that executes, then calls the actual route returns as expected
 */
exports.testRequestWithHandlerCalled = function (test) {
	var resource = createResource(['GET']);

	var road = new roads.Road(resource);
	road.use(function (method, url, body, headers, next) {
		return next();
	});//*/

	road.request('GET', '/', 'yeah', {
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
 * Ensure that a request handler that executes, then calls the actual route returns as expected
 */
exports.testRequestErrorWithHandler = function (test) {
	var resource = new roads.Resource({
		methods : {
			GET : function () {
				throw new Error('huh');
			}
		}
	});

	var road = new roads.Road(resource);

	road.use(function (method, url, body, headers, next) {
		return next();
	});//*/

	road.request('GET', '/', 'yeah', {
		"one" : "two"
	}).then(function (response) {
		// this endpoint should error
		test.ok(false);
		test.done();
	}).catch(function (e) {
		test.equal(e.message, 'huh');
		test.done();
	});
};

/**
 * Ensure a request handler that does not call the actual route returns as expected
 */
exports.testRequestWithHandlerNotCalled = function (test) {
	var resource = createResource(['GET']);
	var road = new roads.Road(resource);
	var response = {"stuff" : "what"};

	road.use(function (url, body, headers, next) {
		return response;
	});//*/

	road.request('GET', '/', 'yeah', {
		"one" : "two"
	}).then(function (new_response) {
		test.deepEqual(response, new_response);
		test.done();
	});
};

/**
 * Ensure that you can handle errors properly from the request handler
 */
exports.testRequestErrorWithHandlerThatCatchesErrors = function (test) {
	var resource = new roads.Resource({
		methods : {
			GET : function () {
				throw new Error('huh');
			}
		}
	});

	var road = new roads.Road(resource);

	road.use(function (method, url, body, headers, next) {
		return next()
			.catch(function (error) {
				return {"error" : error.message};
			});
	});//*/

	road.request('GET', '/', 'yeah', {
		"one" : "two"
	}).then(function (response) {
		test.deepEqual(response, {"error":"huh"});
		test.done();
	});
};
