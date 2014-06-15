"use strict";

/**
* api.js
* Copyright(c) 2014 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

var url_module = require('url');
var Promise = require('bluebird');
var Response = require('./response');

var API = module.exports.API = function API (rootResource, representations) {
	this.rootResource = rootResource;

	// ensure we have at least one resource to route to
	if (!this.rootResource) {
		throw new Error('You must configure a root resource before making API requests');
	}

	this.representations = representations;

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
	return Promise.coroutine(this.locateRoute(url.pathname, method))(url, body, headers);
};

/**
 * Find the appropriate route for the requested pathname and method
 * 
 * @param  string pathname [description]
 * @param  sring method   [description]
 * @return function
 */
API.prototype.locateRoute = function (pathname, method) {
	var api = this;
	var resource = this.locateResource(pathname);

	// If we could not find the appropriate resource, 404 not found
	if (!resource) {
		return function* () {
			return new Response(api.representations.server.notFound(pathname), 404);
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

	return resource[method];
}

/**
 * Route the pathname directly to a resource object
 * 
 * @param  string pathname
 * @return Resource
 */
API.prototype.locateResource = function (pathname) {
	pathname = pathname.replace(/\/$/, '');

	// this will cause issues
	var parts = pathname.split('/');

	// the uri starts with a forward slash, so we will have an empty string at the start of the array
	var part = parts.shift();

	var resource = this.rootResource;

	// loop through every part separated by slashes and incrementally check them against the routes
	while (parts.length) {
		part = parts.shift();
		resource = resource.getResource(part);

		if (!resource) {
			return false;
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