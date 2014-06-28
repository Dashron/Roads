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
	}

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

	test.equal(resource, api.locateResource(url_module.parse('/')));
	test.done();
};

/**
 * Ensure we get a proper success route
 * 
 * @param  {[type]} test [description]
 * @return {[type]}      [description]
 */
exports.testSuccessLocateRoute = function (test) {
	var resource = createResource(['GET']);
	var api = new API(resource);

	var route = Promise.coroutine(api.locateRoute(url_module.parse('/'), 'GET'));

	route({path : 'a'}, 'b', 'c').then(function (response) {
		test.deepEqual({
			path : 'a',
			method : 'GET',
			body : 'b',
			headers : 'c'
		}, response);

		test.done();
	});
};

/**
 * Ensure we get a proper failed url route
 * 
 * @param  {[type]} test [description]
 * @return {[type]}      [description]
 */
exports.testInvalidPathLocateRoute = function (test) {
	var resource = createResource(['GET']);
	var api = new API(resource);

	var route = Promise.coroutine(api.locateRoute(url_module.parse('/stuff'), 'GET'));

	route({path : 'a'}, 'b', 'c').then(function (response) {
		test.ok(false);
		test.done();
	}).catch(function (e) {
		test.equal(e.code, 404);
		test.equal(e.message, '/stuff');

		test.done();
	});
};

/**
 * Ensure we get a proper failed method route
 * 
 * @param  {[type]} test [description]
 * @return {[type]}      [description]
 */
exports.testInvalidMethodLocateRoute = function (test) {
	var resource = createResource(['GET']);
	var api = new API(resource);

	var route = Promise.coroutine(api.locateRoute(url_module.parse('/'), 'POST'));

	route({path : 'a'}, 'b', 'c').then(function (response) {
		test.ok(false);
		test.done();
	}).catch(function (e) {
		test.equal(e.code, 405);
		test.deepEqual(e.message, ['GET']);

		test.done();
	});
};

/**
 * We need to do a bunch of stuff here
 * 
 * @param  {[type]} test [description]
 * @return {[type]}      [description]
 */
exports.testServer = function (test) {
	// incomplete
	test.done();
};


/**
 * Ensure that the basic request system lines up
 * 
 * @param  {[type]} test [description]
 * @return {[type]}      [description]
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