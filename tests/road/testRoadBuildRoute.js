"use strict";

var roads = require('../../index.js');
var url_module = require('url');

/**
 * Create a mock resource
 */
function createResource (methods, resources) {
	var endpoint = function (method) {
		return function* (url, body, headers) {
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
	var route = road._buildRoute('GET', url_module.parse('/'), {'another':'banana'}, {'test':'what'});

	route()
		.then(function (response) {
			test.equal(response.path, '/');
			test.equal(response.method, 'GET');
			test.deepEqual(response.body, {'another':'banana'});
			test.deepEqual(response.headers, {'test':'what'});

			// verify context. I wish this could be more accurate
			test.equal(typeof(response.context.request), 'function');
			test.ok(Array.isArray(response.context.http_methods));
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
	var route = road._buildRoute('GET', url_module.parse('/stuff'), {'another':'banana'}, {'test':'what'});

	test.throws(function () {
		route();
	}, Error, '/stuff');
	test.done();
};

/**
 * Test buildRoute failures (specifically method not allowed) when a route does not have an onRequest handler
 * Errors will throw when the route is invoked (usually road.request)
 */
exports.testBuildRouteMissesMethod = function (test) {
	var resource = createResource(['GET']);
	var road = new roads.Road(resource);
	var route = road._buildRoute('POST', url_module.parse('/stuff'), {'another':'banana'}, {'test':'what'});

	test.throws(function () {
		route();
	}, Error, ['GET']);
	test.done();
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

	var route = road._buildRoute('GET', url_module.parse('/'), {'another':'banana'}, {'test':'what'});

	test.equal(typeof(route), 'function');
	route()
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
		})
		.catch(function (err) {
			console.log(err);
			test.fail(err);
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
		this.contextChanger = true;

		next()
		.then(function (response) {
			test.ok(false);
		})
		.catch(function (e) {
			test.equal(e.message, '/stuff');
			test.done();
		});
	});

	var route = road._buildRoute('GET', url_module.parse('/stuff'), {'another':'banana'}, {'test':'what'});
	test.equal(typeof(route), 'function');
	route();
};

/**
 * Test buildRoute failures (specifically method not allowed) when a route has a request handler (which transfers
 * errors into invoking next instead of invoking road.request)
 */
exports.testBuildRouteMissesMethodWithOnRequest = function (test) {
	var resource = createResource(['GET']);
	var road = new roads.Road(resource);
	
	road.use(function (method, path, body, headers, next) {
		this.contextChanger = true;

		next()
		.then(function (response) {
			test.ok(false);
		})
		.catch(function (e) {
			test.deepEqual(e.message, ['GET']);
			test.done();
		});
	});

	var route = road._buildRoute('POST', url_module.parse('/'), {'another':'banana'}, {'test':'what'});
	test.equal(typeof(route), 'function');
	route();
};