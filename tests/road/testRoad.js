"use strict";

var roads = require('../../index.js');
var url_module = require('url');
var coroutine = require('roads-coroutine');

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
 * Ensure that we can find the proper resource for a url
 */
exports.testSuccesslocateResource = function (test) {
	var resource = createResource(['GET']);
	var road = new roads.Road(resource);

	test.equal(resource, road._locateResource(url_module.parse('/')));
	test.done();
};

/**
 * If there is no proper route, locate resource should return null
 */
exports.testFailedlocateResource = function (test) {
	var resource = createResource(['GET']);
	var road = new roads.Road(resource);

	test.equal(null, road._locateResource(url_module.parse('/blah')));
	test.done();
};

/**
 * Ensure that success routes return promises
 */
exports.testSuccessLocateRoute = function (test) {
	var resource = new roads.Resource({
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

	var road = new roads.Road(resource);
	var route = road._locateRoute(resource, 'GET', url_module.parse('/'), {'a' : 'b'}, {'c' : 'd'});

	test.deepEqual({
		path : '/',
		method : 'GET',
		body : {'a' : 'b'},
		headers : {'c' : 'd'}
	}, route(url_module.parse('/'), {'a' : 'b'}, {'c' : 'd'}));

	test.done();
};

/**
 * Ensure that success routes return promises
 */
exports.testSuccessLocateCoroutineRoute = function (test) {
	var resource = createResource(['GET']);

	var road = new roads.Road(resource);
	var route = road._locateRoute(resource, 'GET', url_module.parse('/'));

	coroutine(route)(url_module.parse('/'), {'a' : 'b'}, {'c' : 'd'})
		.then(function (result) {
			test.deepEqual({
				path : '/',
				method : 'GET',
				body : {'a' : 'b'},
				headers : {'c' : 'd'}
			}, result);

			test.done();
		}).catch(function (e) {
			console.log(e);
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
	var road = new roads.Road(resource);

	// no resource found
	var route = road._locateRoute(null, 'GET', url_module.parse('/stuff'));

	try {
		route('GET', url_module.parse('/stuff'));
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
	var road = new roads.Road(resource);

	var route = road._locateRoute(resource, 'POST', url_module.parse('/'));

	try {
		route('POST', url_module.parse('/'));
	} catch (e) {
		test.equal(e.code, 405);
		test.deepEqual(e.message, ['GET']);

		test.done();
	}
};


/**
 * We need to do a bunch of stuff here
 */
exports.testServer = function (test) {
	// incomplete
	test.done();
};