"use strict";

/**
* api.js
* Copyright(c) 2014 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

var url_module = require('url');
var Promise = require('bluebird');
var roads = require('../index');
var Response = roads.Response;

var API = module.exports = function API (rootResource) {
	this.rootResource = rootResource;

	// ensure we have at least one resource to route to
	if (!this.rootResource) {
		throw new Error('You must configure a root resource before making API requests');
	}
};

API.prototype.rootResource = null;
API.prototype._onError = null;

/**
 * 
 * @param  {Function} fn At the moment this can not be a coroutine. That may change in the future
 * @return {[type]}      [description]
 */
API.prototype.onError = function (fn) {
	this._onError = fn;
};

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
			// we throw this so that it lines up with how all errors are handled
			throw new roads.HttpError(parsed_url.pathname, 404);
		}
	}

	// If we could not find the appropriate route, 405 Method not allowed
	if (!resource[method]) {
		return function* () {
			// we throw this so that it lines up with how all errors are handled
			throw new roads.HttpError(resource.getValidMethods(), 405);
		}
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
			if (resource_info.key) {
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

	http_request.on('readable', function () {
  		var chunk;
		while (null !== (chunk = http_request.read())) {
			body += chunk;
		}
	});

	http_request.on('end', function () {

		// execute the api logic and retrieve the appropriate response object
		api.request(http_request.method, http_request.url, body, http_request.headers)
			.then(function (response) {
				response.writeTo(http_response)
					.catch(function (err) {
						api._onError(err).writeTo(http_response);
					});
			})
			.catch(function (err) {
				// route errors go to the unknown error representation
				api._onError(err).writeTo(http_response);
			});
	});

	// server request errors go to the unknown error representation
	http_request.on('error', function (err) {
		api._onError(err).writeTo(http_response);
	});
}