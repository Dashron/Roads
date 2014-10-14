"use strict";

var roads = require('../index.js');

/**
 * Create a mock resource
 * 
 * @param  {[type]} methods   [description]
 * @param  {[type]} resources [description]
 * @return {[type]}           [description]
 */
function createResource (methods, resources) {
	var endpoint = function* (url, body, headers) {
		return {
			url : url,
			body : body,
			headers : headers
		};
	};

	var definition = {
		methods : {
		}
	};

	if (methods) {
		methods.forEach(function (method) {
			definition.methods[method] = endpoint;
		});
	}

	if (resources) {
		definition.resources = resources;
	}

	return new roads.Resource(definition);
}

/**
 * Ensure that we can find the valid methods from allowsMethod
 * 
 * @param  {[type]} test [description]
 * @return {[type]}      [description]
 */
exports.testAllowsMethod = function (test) {
	var resource = createResource(['GET']);

	test.ok(resource.allowsMethod('GET'));
	test.done();
};

/**
 * Ensure that we don't get incorrect responess from allowsMethod
 * 
 * @param  {[type]} test [description]
 * @return {[type]}      [description]
 */
exports.testNoAllowedMethod = function (test) {
	var resource = createResource(['GET']);

	test.ok(!resource.allowsMethod('POST'));
	test.done();
};

/**
 * Ensure that we get back the expected methods from getValidMethods
 * 
 * @param  {[type]} test [description]
 * @return {[type]}      [description]
 */
exports.testGetValidMethods = function (test) {
	var resource = createResource(['GET']);

	test.deepEqual(resource.getValidMethods(), ['GET']);
	test.done();
};

/**
 * Ensure that literals match a literal route
 * 
 * @param  {[type]} test [description]
 * @return {[type]}      [description]
 */
exports.testGetSuccessfulResourceKey = function (test) {
	var sub_resource = createResource(['GET']);
	var resource = createResource(['GET'], {
		'test' : sub_resource
	});

	test.deepEqual(resource.getResourceKey('test'), {
		route : sub_resource
	});

	test.done();
};

/**
 * Ensure that strings match the string route
 * 
 * @param  {[type]} test [description]
 * @return {[type]}      [description]
 */
exports.testGetSuccessfulStringResourceKey = function (test) {
	var sub_resource = createResource(['GET']);
	var resource = createResource(['GET'], {
		'$test' : sub_resource
	});

	test.deepEqual(resource.getResourceKey('test'), {
		key : 'test',
		value : 'test',
		route : sub_resource
	});

	test.done();
};

/**
 * Ensure that ints match the int routes
 * 
 * @param  {[type]} test [description]
 * @return {[type]}      [description]
 */
exports.testGetSuccessfulIntResourceKey = function (test) {
	var sub_resource = createResource(['GET']);
	var resource = createResource(['GET'], {
		'#test' : sub_resource
	});

	test.deepEqual(resource.getResourceKey(1), {
		key : 'test',
		value : 1,
		route : sub_resource
	});

	test.done();
};

/**
 * Ensure that arbitrary strings don't match explicit route paths
 * 
 * @param  {[type]} test [description]
 * @return {[type]}      [description]
 */
exports.testGetUnsuccessfulResourceKey = function (test) {
	var sub_resource = createResource(['GET']);
	var resource = createResource(['GET'], {
		'test' : sub_resource
	});

	test.ok(!resource.getResourceKey('stuff'));

	test.done();
};

/**
 * Ensure that string requests on an int route fail
 * @param  {[type]} test [description]
 * @return {[type]}      [description]
 */
exports.testGetUnsuccessfulIntResourceKey = function (test) {
	var sub_resource = createResource(['GET']);
	var resource = createResource(['GET'], {
		'#test' : sub_resource
	});

	test.ok(!resource.getResourceKey('stuff'));

	test.done();
};

/**
 * Ensure that strings after numbers don't screw anything up when you have a number
 * @param  {[type]} test [description]
 * @return {[type]}      [description]
 */
exports.testGetProperIntSubresourceResourceKey = function (test) {
	var sub_resource = createResource(['GET']);
	var sub_resource2 = createResource(['POST']);

	var resource = createResource(['GET'], {
		'#test' : sub_resource,
		'$stuff' : sub_resource2
	});

	test.deepEqual(resource.getResourceKey(1), {
		key : 'test',
		value : 1,
		route : sub_resource
	});

	test.done();
};

/**
 * Ensure that strings after numbers don't screw anything up when you have a string
 * @param  {[type]} test [description]
 * @return {[type]}      [description]
 */
exports.testGetProperIStringSubresourceResourceKey = function (test) {
	var sub_resource = createResource(['GET']);
	var sub_resource2 = createResource(['POST']);

	var resource = createResource(['GET'], {
		'#test' : sub_resource,
		'$stuff' : sub_resource2
	});

	test.deepEqual(resource.getResourceKey('yeah'), {
		key : 'stuff',
		value : 'yeah',
		route : sub_resource2
	});

	test.done();
};