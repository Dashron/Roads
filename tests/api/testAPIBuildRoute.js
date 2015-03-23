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
	var api = new roads.API(resource);
	var route = api._buildRoute(url_module.parse('/'), 'GET', {'another':'banana'}, {'test':'what'});

	route(url_module.parse('/'), 'GET', {'another':'banana'}, {'test':'what'})
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
 * Errors will throw when the route is invoked (usually api.request)
 */
exports.testBuildRouteMissesUrl = function (test) {
	var resource = createResource(['GET']);
	var api = new roads.API(resource);
	var route = api._buildRoute(url_module.parse('/stuff'), 'GET', {'another':'banana'}, {'test':'what'});

	test.throws(function () {
		route();
	}, Error, '/stuff');
	test.done();
};

/**
 * Test buildRoute failures (specifically method not allowed) when a route does not hves an onRequest handler
 * Errors will throw when the route is invoked (usually api.request)
 */
exports.testBuildRouteMissesMethod = function (test) {
	var resource = createResource(['GET']);
	var api = new roads.API(resource);
	var route = api._buildRoute(url_module.parse('/stuff'), 'POST', {'another':'banana'}, {'test':'what'});

	test.throws(function () {
		route();
	}, Error, ['GET']);
	test.done();
};

/**
 * Test buildRoute success when a route has an onRequest handler
 */
exports.testBuildRouteHitsWithOnRequest = function (test) {
	var resource = createResource(['GET']);
	var api = new roads.API(resource);

	api.onRequest(function (method, path, body, headers, next) {
		this.contextChanger = true;
		return next();
	});

	var route = api._buildRoute(url_module.parse('/'), 'GET', {'another':'banana'}, {'test':'what'});

	test.equal(typeof(route), 'function');
	route(url_module.parse('/'), 'GET', {'another':'banana'}, {'test':'what'})
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
 * Test buildRoute failures (specifically url not found) when a route has an onRequest handler (which transfers
 * errors into invoking next instead of invoking api.request)
 */
exports.testBuildRouteMissesUrlWithOnRequest = function (test) {
	var resource = createResource(['GET']);
	var api = new roads.API(resource);
	
	api.onRequest(function (method, path, body, headers, next) {
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

	var route = api._buildRoute(url_module.parse('/stuff'), 'GET', {'another':'banana'}, {'test':'what'});
	test.equal(typeof(route), 'function');
	route();
};

/**
 * Test buildRoute failures (specifically method not allowed) when a route has an onRequest handler (which transfers
 * errors into invoking next instead of invoking api.request)
 */
exports.testBuildRouteMissesMethodWithOnRequest = function (test) {
	var resource = createResource(['GET']);
	var api = new roads.API(resource);
	
	api.onRequest(function (method, path, body, headers, next) {
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

	var route = api._buildRoute(url_module.parse('/'), 'POST', {'another':'banana'}, {'test':'what'});
	test.equal(typeof(route), 'function');
	route();
};