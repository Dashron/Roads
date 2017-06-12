"use strict";

var roads = require('../../../index.js');
var url_module = require('url');


/**
 * Test buildNext success when a route does not have an onRequest handler
 */
exports.testbuildNextHits = function (test) {
	var road = new roads.Road();

	road._buildNext('GET', url_module.parse('/'))()
	.then(function (response) {
		test.ok(true);
		test.done();
	})
	.catch(function (e) {
		console.log(e.stack);
		test.fail();
		test.done();
	});
};

/**
 * Test buildNext success when a route does not have an onRequest handler and is async
 
exports.testBuildAsyncouteHits = function (test) {
	var road = new roads.Road(new roads.Resource({
		methods: {
			GET: async function () {
				return { 'happy': 'banana'};
			}
		}
	}));

	road._buildNext('GET', url_module.parse('/'), {'another':'banana'}, {'test':'what'})()
	.then(function (response) {
		test.deepEqual(response, {'happy':'banana'});
		test.done();
	});
};

/**
 * Test buildNext failures (specifically url not found) when a route does not have an onRequest handler
 * Errors will throw when the route is invoked (usually road.request)
 
exports.testbuildNextMissesUrl = function (test) {
	var resource = createResource(['GET']);
	var road = new roads.Road(resource);

	road._buildNext('GET', url_module.parse('/stuff'), {'another':'banana'}, {'test':'what'})()
	.catch(function (error) {
		test.deepEqual('/stuff', error.message);
		test.deepEqual(404, error.code);
		test.done();
	});
};

/**
 * Test buildNext failures (specifically method not allowed) when a route does not have an onRequest handler
 * Errors will throw when the route is invoked (usually road.request)
exports.testbuildNextMissesMethod = function (test) {
	var resource = createResource(['GET']);
	var road = new roads.Road(resource);

	road._buildNext('POST', url_module.parse('/'), {'another':'banana'}, {'test':'what'})()
	.catch(function (error) {
		test.deepEqual(['GET'], error.message);
		test.deepEqual(405, error.code);
		test.done();
	});
};

/**
 * Test buildNext success when a route has a request handler

exports.testbuildNextHitsWithOnRequest = function (test) {
	var resource = createResource(['GET']);
	var road = new roads.Road(resource);

	road.use(function (method, path, body, headers, next) {
		this.contextChanger = true;
		return next();
	});

	road._buildNext('GET', url_module.parse('/'), {'another':'banana'}, {'test':'what'})()
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
 * Test buildNext failures (specifically url not found) when a route has a request handler (which transfers
 * errors into invoking next instead of invoking road.request)
exports.testbuildNextMissesUrlWithOnRequest = function (test) {
	var resource = createResource(['GET']);
	var road = new roads.Road(resource);
	
	road.use(function (method, url, body, headers, next) {
		return next()
		.catch(function (e) {
			test.equal(e.message, '/stuff');
			return 'boooo';
		});
	});

	road._buildNext('GET', url_module.parse('/stuff'), {'another':'banana'}, {'test':'what'})()
	.then(function (response) {
		test.equals('boooo', response);
		test.done();
	});
};

/**
 * Test buildNext failures (specifically method not allowed) when a route has a request handler (which transfers
 * errors into invoking next instead of invoking road.request)
exports.testbuildNextMissesMethodWithOnRequest = function (test) {
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

	road._buildNext('POST', url_module.parse('/'), {'another':'banana'}, {'test':'what'})()
	.then(function (response) {
		test.equals('booooooo', response);
		test.done();
	});
};

/**
 * Ensure that we can find the proper resource for a url
exports.testSuccesslocateResource = function (test) {
	var resource = createResource(['GET']);
	var road = new roads.Road(resource);

	test.equal(resource, road._locateResource(resource, url_module.parse('/')));
	test.done();
};

/**
 * If there is no proper route, locate resource should return null
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
exports.testInvalidRouteThrowsError = function (test) {
	var road = new roads.Road(new roads.Resource({
		methods: {
			GET: "fail fail fail!"
		}
	}));

	test.throws(function () {
		road._buildNext('GET', url_module.parse('/'), {'another':'banana'}, {'test':'what'});
	}, "");
	test.done();
};
*/