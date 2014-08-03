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
 * Ensure that we can find the proper resource for a url
 * 
 * @param  {[type]} test [description]
 * @return {[type]}      [description]
 */
exports.testlocateResource = function (test) {
	var resource = createResource(['GET']);
	var api = new API(resource);

	test.equal(resource, api._locateResource(url_module.parse('/')));
	test.done();
};

/**
 * Ensure that generators that are provided to createCoroutine become coroutines
 */
exports.testCreateValidCoroutine = function (test) {
	var resource = createResource(['GET']);
	var api = new API(resource);
	var return_val = "very specific string";

	api._createCoroutine(function* () {
		yield new Promise(function (resolve, reject) {
			resolve();
		});

		return return_val;
	})().then(function (val) {
		test.equals(val, return_val);
		test.done();
	}).catch(function (e) {
		// this shouldn't be reached
		test.ok(false);
		test.done();
	});
};

/**
 * Ensure that non-generators that are provided to createCoroutine are passed through unchanged
 */
exports.testCreateFunctionCoroutine = function (test) {
	var resource = createResource(['GET']);
	var api = new API(resource);
	var fn = function () {
		return true;
	};

	test.equals(api._createCoroutine(fn), fn);
	test.done();
};

/**
 * Ensure that success routes return promises
 */
exports.testSuccessLocateRoute = function (test) {
	var resource = new Resource({
		methods : {
			GET : function (url, body, headers) {
				return {
					path : url.path,
					method : 'GET',
					body : body,
					headers : headers
				};
			}
		}
	});

	var api = new API(resource);
	var route = api._locateRoute(url_module.parse('/'), 'GET');

	test.deepEqual({
		path : '/',
		method : 'GET',
		body : 'b',
		headers : 'c'
	}, route({path : '/'}, 'b', 'c'));

	test.done();
};

/**
 * Ensure that success routes return promises
 */
exports.testSuccessLocateCoroutineRoute = function (test) {
	var resource = createResource(['GET']);

	var api = new API(resource);
	var route = api._locateRoute(url_module.parse('/'), 'GET');

	route({path : '/'}, 'b', 'c')
		.then(function (result) {
			test.deepEqual({
				path : '/',
				method : 'GET',
				body : 'b',
				headers : 'c'
			}, result);

			test.done();
		}).error(function (e) {
			// this should never happen
			test.ok(false);
			test.done();
		});
};

/**
 * Ensure that fail routes throw exceptions
 */
exports.testInvalidPathLocateRoute = function (test) {
	var resource = createResource(['GET']);
	var api = new API(resource);

	var route = api._locateRoute(url_module.parse('/stuff'), 'GET');

	try {
		route({path : 'a'}, 'b', 'c');
	} catch (e) {
		test.equal(e.code, 404);
		test.equal(e.message, '/stuff');

		test.done();
	}
};

/**
 * Ensure we get a proper failed method route
 */
exports.testInvalidMethodLocateRoute = function (test) {
	var resource = createResource(['GET']);
	var api = new API(resource);

	var route = api._locateRoute(url_module.parse('/'), 'POST');

	try {
		route({path : 'a'}, 'b', 'c');
	} catch (e) {
		test.equal(e.code, 405);
		test.deepEqual(e.message, ['GET']);

		test.done();
	}
};

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

/**
 * We need to do a bunch of stuff here
 */
exports.testServer = function (test) {
	// incomplete
	test.done();
};


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