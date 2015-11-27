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
 * Test that the use function returns itself for viable chaining
 */
exports.testUseReturnsSelf = function (test) {
	var resource = createResource(['GET']);
	var road = new roads.Road(resource);

	test.equal(road.use(function (method, path, body, headers, next) {
		return next();
	}), road);

	test.done();
};