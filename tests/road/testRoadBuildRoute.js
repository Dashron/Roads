"use strict";

var roads = require('../../index.js');
var url_module = require('url');

/**
 * Create a mock resource
 */
function createResource (methods, resources) {
	var endpoint = function (method) {
		return function (url, body, headers) {
			return {
				path : url.path,
				method : method,
				body : body,
				headers : headers,
				context : this
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
 * Test buildRoute success when a route does not have an onRequest handler
 */
exports.testBuildRouteHits = function (test) {
	var resource = createResource(['GET']);
	var road = new roads.Road(resource);
	road._buildRoute('GET', url_module.parse('/'), {'another':'banana'}, {'test':'what'})()
	.then(function (response) {
		test.equal(response.path, '/');
		test.equal(response.method, 'GET');
		test.deepEqual(response.body, {'another':'banana'});
		test.deepEqual(response.headers, {'test':'what'});

		// verify context. I wish this could be more accurate
		test.equal(typeof(response.context.request), 'function');
		test.ok(Array.isArray(response.context.http_methods));
		test.done();
	})
	.catch(function (e) {
		console.log(e);
		test.fail();
		test.done();
	});
};

/**
 * Test buildRoute success when a route does not have an onRequest handler and is a generator
 */
exports.testBuildCoroutineRouteHits = function (test) {
	var road = new roads.Road(new roads.Resource({
		methods: {
			GET: function* () {
				return { 'happy': 'banana'};
			}
		}
	}));

	road._buildRoute('GET', url_module.parse('/'), {'another':'banana'}, {'test':'what'})()
	.then(function (response) {
		test.deepEqual(response, {'happy':'banana'});
		test.done();
	});
};

/**
 * Test buildRoute failures (specifically url not found) when a route does not have an onRequest handler
 * Errors will throw when the route is invoked (usually road.request)
 */
exports.testBuildRouteMissesUrl = function (test) {
	var resource = createResource(['GET']);
	var road = new roads.Road(resource);

	road._buildRoute('GET', url_module.parse('/stuff'), {'another':'banana'}, {'test':'what'})()
	.catch(function (error) {
		test.deepEqual('/stuff', error.message);
		test.deepEqual(404, error.code);
		test.done();
	});
};

/**
 * Test buildRoute failures (specifically method not allowed) when a route does not have an onRequest handler
 * Errors will throw when the route is invoked (usually road.request)
 */
exports.testBuildRouteMissesMethod = function (test) {
	var resource = createResource(['GET']);
	var road = new roads.Road(resource);

	road._buildRoute('POST', url_module.parse('/'), {'another':'banana'}, {'test':'what'})()
	.catch(function (error) {
		test.deepEqual(['GET'], error.message);
		test.deepEqual(405, error.code);
		test.done();
	});
};

/**
 * Test buildRoute success when a route has a request handler
 */
exports.testBuildRouteHitsWithOnRequest = function (test) {
	var resource = createResource(['GET']);
	var road = new roads.Road(resource);

	road.use(function (method, path, body, headers, next) {
		this.contextChanger = true;
		return next();
	});

	road._buildRoute('GET', url_module.parse('/'), {'another':'banana'}, {'test':'what'})()
	.then(function (response) {
		test.equal(response.path, '/');
		test.equal(response.method, 'GET');
		test.deepEqual(response.body, {'another':'banana'});
		test.deepEqual(response.headers, {'test':'what'});

		// verify context. I wish this could be more accurate
		test.equal(typeof(response.context.request), 'function');
		test.ok(response.context.contextChanger);
		test.ok(Array.isArray(response.context.http_methods));
		test.done();
	});
};

/**
 * Test buildRoute failures (specifically url not found) when a route has a request handler (which transfers
 * errors into invoking next instead of invoking road.request)
 */
exports.testBuildRouteMissesUrlWithOnRequest = function (test) {
	var resource = createResource(['GET']);
	var road = new roads.Road(resource);
	
	road.use(function (method, url, body, headers, next) {
		return next()
		.catch(function (e) {
			test.equal(e.message, '/stuff');
			return 'boooo';
		});
	});

	road._buildRoute('GET', url_module.parse('/stuff'), {'another':'banana'}, {'test':'what'})()
	.then(function (response) {
		test.equals('boooo', response);
		test.done();
	});
};

/**
 * Test buildRoute failures (specifically method not allowed) when a route has a request handler (which transfers
 * errors into invoking next instead of invoking road.request)
 */
exports.testBuildRouteMissesMethodWithOnRequest = function (test) {
	var resource = createResource(['GET']);
	var road = new roads.Road(resource);
	
	road.use(function (method, path, body, headers, next) {
		var context = this;
		return next()
		.catch(function (e) {
			test.deepEqual(e.message, ['GET']);
			return 'booooooo';
		});
	});

	road._buildRoute('POST', url_module.parse('/'), {'another':'banana'}, {'test':'what'})()
	.then(function (response) {
		test.equals('booooooo', response);
		test.done();
	});
};

/**
 * Ensure that we can find the proper resource for a url
 */
exports.testSuccesslocateResource = function (test) {
	var resource = createResource(['GET']);
	var road = new roads.Road(resource);

	test.equal(resource, road._locateResource(resource, url_module.parse('/')));
	test.done();
};

/**
 * If there is no proper route, locate resource should return null
 */
exports.testFailedlocateResource = function (test) {
	var resource = createResource(['GET']);
	var road = new roads.Road(resource);

	test.equal(null, road._locateResource(resource, url_module.parse('/blah')));
	test.done();
};

/**
 * [testInvalidRouteThrowsError description]
 * @param  {[type]} test [description]
 * @return {[type]}      [description]
 */
exports.testInvalidRouteThrowsError = function (test) {
	var road = new roads.Road(new roads.Resource({
		methods: {
			GET: "fail fail fail!"
		}
	}));

	test.throws(function () {
		road._buildRoute('GET', url_module.parse('/'), {'another':'banana'}, {'test':'what'});
	}, "");
	test.done();
};