"use strict";

/**
* api.js
* Copyright(c) 2014 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

var url_module = require('url');
var Promise = require('bluebird');
var Response = require('../index').Response;

var API = module.exports = function API (rootResource, representations) {
	this.rootResource = rootResource;

	// ensure we have at least one resource to route to
	if (!this.rootResource) {
		throw new Error('You must configure a root resource before making API requests');
	}

	this.representations = applyCoroutines(representations);

	//Ensure that we have some representations that the internal code relies on
	if (!this.representations.server.unknown) {
		throw new Error('You must configure a server.unknown representation before making API requests');
	}

	if (!this.representations.server.notFound) {
		throw new Error('You must configure a server.notFound representation before making API requests');
	}

	if (!this.representations.server.notAllowed) {
		throw new Error('You must configure a server.notAllowed representation before making API requests');
	}

	if (!this.representations.server.options) {
		throw new Error('You must configure a server.options representation before making API requests');
	}

	this.rootResource.loadRepresentations(this.representations);
};

API.prototype.rootResource = null;
API.prototype.representations = null;

/**
 * Make a request into the API
 * 
 * @param  string method
 * @param  string url     
 * @param  string body    
 * @param  array headers 
 * @return string
 */
API.prototype.request = function (method, url, body, headers) {
	url = url_module.parse(url, true);
	return Promise.coroutine(this.locateRoute(url, method))(url, body, headers);
};

/**
 * Find the appropriate route for the requested pathname and method
 * 
 * @param  string pathname [description]
 * @param  sring method   [description]
 * @return function
 */
API.prototype.locateRoute = function (parsed_url, method) {
	var api = this;
	var resource = this.locateResource(parsed_url);

	// If we could not find the appropriate resource, 404 not found
	if (!resource) {
		return function* () {
			return new Response(api.representations.server.notFound(parsed_url.pathname), 404);
		};
	}

	// If we could not find the appropriate route, 405 Method not allowed
	if (!resource[method]) {
		return function* () {
			return new Response(api.representations.server.notAllowed(resource.getValidMethods()), 405, {
				allow : resource.getValidMethods().join(',')
			});
		};
	}

	return resource[method].bind(resource);
}

/**
 * Route the pathname directly to a resource object
 * 
 * @param  string pathname
 * @return Resource
 */
API.prototype.locateResource = function (parsed_url) {
	var pathname = parsed_url.pathname.replace(/\/$/, '');

	// this will cause issues
	var parts = pathname.split('/');

	// the uri starts with a forward slash, so we will have an empty string at the start of the array
	var part = parts.shift();

	var resource = this.rootResource;
	var resource_info = null;

	// Define the object that will hold all url arguments
	if (!parsed_url.args) {
		parsed_url.args = {};
	}

	// loop through every part separated by slashes and incrementally check them against the routes
	while (parts.length) {
		part = parts.shift();
		resource_info = resource.getResourceKey(part);

		if (!resource_info) {
			return false;
		} else {
			resource = resource_info.route;
			// apply the route parts to the url arguments field
			if (resource_info !== true) {
				parsed_url.args[resource_info.key] = resource_info.value;
			}
		}
	}
	
	return resource;
}

/**
 * Helper function so the api can be thrown directly into http.createServer
 * 
 * @param  ClientRequest http_request
 * @param  ServerResponse http_response
 */
API.prototype.server = function (http_request, http_response) {
	var api = this;
	var body = '';

	http_request.on('data', function (data) {
		body += data;
	});

	http_request.on('end', function () {

		// execute the api logic and retrieve the appropriate response object
		api.request(http_request.method, http_request.url, body, http_request.headers)
			.then(function (response) {
				if (!response instanceof Response) {
					throw new Error('api request did not return a response object.');
				}

				response.writeTo(http_response)
					.catch(function (err) {
						// rendering errors go to the unknown error representation
						var response = new Response(api.representations.server.unknown(err), 500);
						response.writeTo(http_response);
					});
			})
			.catch(function (err) {
				// route errors go to the unknown error representation
				var response = new Response(api.representations.server.unknown(err), 500);
				response.writeTo(http_response);
			});
	});

	// server request errors go to the unknown error representation
	http_request.on('error', function (err) {
		var response = new Response(api.representations.server.unknown(err), 500);
		response.writeTo(http_response);
	});
}

var applyCoroutines = function (representations) {
	for (var key in representations) {
		switch (typeof(representations[key])) {
			case "object" :
				representations[key] = applyCoroutines(representations[key]);
				break;

			case "function" :
				representations[key] = Promise.coroutine(representations[key]);
				break;

			default :
				throw new Error('Only objects and functions are allowed to be provided through the representations list');
		}
	}

	return representations;
};