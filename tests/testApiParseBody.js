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
 * Test that an object passed to parseBody returns immediately
 * @param  {[type]} test [description]
 * @return {[type]}      [description]
 */
exports.testParseObjectBody = function (test) {
	var api = new API(createResource(['GET']));
	var body = {hi: "stuff"};
	test.equal(body, api._parseBody(body));
	test.done();
};

/**
 * Test that an array passed to parseBody returns immediately
 * @param  {[type]} test [description]
 * @return {[type]}      [description]
 */
exports.testParseArrayBody = function (test) {
	var api = new API(createResource(['GET']));
	var body = [{hi: "stuff"}];
	test.equal(body, api._parseBody(body));
	test.done();
};

/**
 * Test that a string passed to parseBody returns immediately
 * @param  {[type]} test [description]
 * @return {[type]}      [description]
 */
exports.testParseStringBody = function (test) {
	var api = new API(createResource(['GET']));
	var body = "stuff";
	test.equal(body, api._parseBody(body));
	test.done();
};

/**
 * Test that an form post body passed to parseBody returns correctly
 * @param  {[type]} test [description]
 * @return {[type]}      [description]
 */
exports.testParseQuerystringBody = function (test) {
	var api = new API(createResource(['GET']));
	var body = "stuff=a&that=b";
	
	test.deepEqual({stuff:"a", that:"b"}, api._parseBody(body, "application/x-www-form-urlencoded"));

	test.done();
};

/**
 * Test that an object encoded as a json string passed to parseBody returns correctly
 * @param  {[type]} test [description]
 * @return {[type]}      [description]
 */
exports.testParseJSONObjectBody = function (test) {
	var api = new API(createResource(['GET']));
	var body = '{"stuff":"a", "that":"b"}';
	
	test.deepEqual({stuff:"a", that:"b"}, api._parseBody(body, "application/json"));

	test.done();
};

/**
 * Test that an array encoded as a json string passed to parseBody returns correctly
 * @param  {[type]} test [description]
 * @return {[type]}      [description]
 */
exports.testParseJSONArrayBody = function (test) {
	var api = new API(createResource(['GET']));
	var body = '["stuff", "b"]';
	
	test.deepEqual(["stuff", "b"], api._parseBody(body, "application/json"));

	test.done();
};

/**
 * Test that invalid json throws an exception
 * @param  {[type]} test [description]
 * @return {[type]}      [description]
 */
exports.testParseInvalidJSONBody = function (test) {
	var api = new API(createResource(['GET']));
	var body = '{stuff yeah';

	test.throws(function () {
		api._parseBody(body, "application/json");
	}, 'SyntaxError: Unexpected token s');

	test.done();
};

exports.testRequestWithInvalidJsonBody = function (test) {
	var api = new API(createResource(['GET']));
	var body = '{stuff yeah';

	api.request('', '', body, {
		'content-type' : "application/json"
	}).then(function (response) {
		// this should never happen
		test.ok(false);
	})
	.catch(function (e) {
		test.equal('Unexpected token s', e.message);
	});

	test.done();
};


/**
 * Ensure that a application/json header with an empty body doesn't blow stuff up. 
 *
 * This isn't really a valid workflow, but we should technically allow it.
 */
exports.testParseEmptyStringBody = function (test) {
	var api = new API(createResource(['GET']));
	var body = '';
	
	test.equal('', api._parseBody(body, "application/json"));

	test.done();
};