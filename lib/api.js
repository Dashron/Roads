"use strict";

/**
* api.js
* Copyright(c) 2014 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

var url_module = require('url');
var qs_module = require('querystring');
var Promise = require('bluebird');
var roads = require('../index');
var Response = roads.Response;
var FieldsFilter = roads.FieldsFilter;

/**
 * API Constructor
 *
 * Creates your API object, so you can use it directly or bind it to an HTTP server. A resource must be provided to this constructor.
 * This resource will be used to generate the response for the root endpoint ( [protocol]://[host]/ ), and can link off to sub resources
 * to define the rest of the endpoints
 * 
 * @param  {Resource} root_resource The Resource object that represents the root endpoint ( [protocol]://[host]/ )
 */
var API = module.exports = function API (root_resource) {
	this.root_resource = root_resource;

	// ensure we have at least one resource to route to
	if (!this.root_resource) {
		throw new Error('You must configure a root resource before making API requests');
	}
};

API.prototype.root_resource = null;
API.prototype._onError = null;
API.prototype._onRequest = null;

/**
 * Assign an on error handler
 * 
 * You must provide a callback to the onError function. This callback will be called any time an error is thrown from a resource, or from the API object.
 *
 * There are only 3 errors that can be thrown from the API object
 *  - *new roads.HttpError(parsed_url.pathname, 404)* If the endpoint could not be found
 *  - *new roads.HttpError(resource.getValidMethods(), 405);* If the endpoint was found, but the HTTP method was not supported
 *  - *new Error()* If an unexpected error occurs
 *
 * Any other error (and possibly some of the three above) can be thrown from a resource object, and will be surfaced through this callback.
 *
 * This callback can return a Response object, which will be rendered for the user if possible.
 *
 * @param  {Function} fn At the moment this can not be a coroutine. That may change in the future
 * @return {[type]}      [description]
 */
API.prototype.onError = function (fn) {
	this._onError = fn;
};

/**
 * 
 * @param  {Function} fn [description]
 * @return {[type]}      [description]
 */
API.prototype.onRequest = function (fn) {
	this._onRequest = fn;
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
	var _self = this;
	var extra_data = {};
	var route = null;

	if (typeof method !== "string") {
		throw new Error('You must provide an HTTP method when making an API request');
	}

	if (typeof url !== "string") {
		throw new Error('You must provide a url when making an API request');
	}

	// Create an empty headers object if no value is provided
	if (!headers) {
		headers = {};
	}

	url = url_module.parse(url, true);

	try {
		body = this._parseBody(body, headers['content-type']);
	} catch (e) {
		// todo: maybe we can make this better, and incorporate it with the _locateRoute method
		return new Promise(function (resolve, reject) {
			reject(e);
		});
	}

	if (this._onRequest) {
		extra_data = function (new_extra_data) {
			return _self._executeRoute(_self._locateRoute(url, method), url, body, headers, new_extra_data);
		};

		route = this._createCoroutine(this._onRequest);
	} else {
		route = this._locateRoute(url, method);
	}
	
	// execute the route and expand/filter the data appropriately
	return this._executeRoute(route, url, body, headers, extra_data)
		.then(function (response) {
			if (!(response instanceof Response)) {
				// we should always return a response object
				response = new Response(response);
			}

			return response.getData().then(function (data) {
				return new FieldsFilter(data).filter(url.query.fields);
			})
			.then(function (data) {
				response.data = data;
				return response;
			});
		});
};

/**
 * Translate the request body into a usable object or array
 * 
 * @param  mixed  body         
 * @param  string content_type
 * @return mixed  parsed body
 */
API.prototype._parseBody = function (body, content_type) {
	if (typeof body === "object" || Array.isArray(body)) {
		// no need to parse if it's already an object
		return body;
	}

	if (content_type === 'application/json') {
		// parse json
		return JSON.parse(body);
	} else if (content_type === 'application/x-www-form-urlencoded') {
		// parse form encoded
		return qs_module.parse(body);
	} else {
		// maybe it's supposed to be literal 
		return body;
	}
};

/**
 * Find the appropriate route for the requested pathname and method
 * 
 * @param  string pathname [description]
 * @param  sring method   [description]
 * @return function
 */
API.prototype._locateRoute = function (parsed_url, method) {
	var resource = this._locateResource(parsed_url);

	// If we could not find the appropriate resource, 404 not found
	if (!resource) {
		return function () {
			// we throw this so that it lines up with how all errors are handled
			throw new roads.HttpError(parsed_url.pathname, 404);
		};
	}

	// If we could not find the appropriate route, 405 Method not allowed
	if (!resource[method]) {
		return function () {
			// we throw this so that it lines up with how all errors are handled
			throw new roads.HttpError(resource.getValidMethods(), 405);
		};
	}

	// We have to check if the function is a generator or not before we bind it, otherwise the new function doesn't pass our current "is a generator" test.
	return this._createCoroutine(resource[method]).bind(resource);
};

/**
 * Identify if a function is a generator, and if so translate it into a coroutine
 * 
 * @param  Function fn
 * @return Function
 */
API.prototype._createCoroutine = function (fn) {
	if (fn.constructor.name === 'GeneratorFunction') {
		return Promise.coroutine(fn);
	} else {
		return fn;
	}
};

/**
 * Execute a resource method, and ensure that a promise is always returned
 * 
 * @param  Function   route
 * @param  string   url
 * @param  Object   body
 * @param  Object   headers
 * @param  Function extra_data
 * @return Promise
 */
API.prototype._executeRoute = function (route, url, body, headers, extra_data) {
	var result = null;

	// Handle errors properly
	try {
		result = route(url, body, headers, extra_data);
	} catch (e) {
		// this should never be reached if route is a coroutine
		return new Promise(function (resolve, reject) {
			reject(e);
		});
	}

	// If the result isn't a promise already, make it one
	if (!(result instanceof Promise)) {
		return new Promise(function (resolve, reject) {
			resolve(result);
		});
	}

	// otherwise give the user what they want
	return result;
};

/**
 * Route the pathname directly to a resource object
 * 
 * @param  string pathname
 * @return Resource
 */
API.prototype._locateResource = function (parsed_url) {
	var pathname = parsed_url.pathname.replace(/\/$/, '');

	// this will cause issues
	var parts = pathname.split('/');

	// the uri starts with a forward slash, so we will have an empty string at the start of the array
	var part = parts.shift();

	var resource = this.root_resource;
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
};

/**
 * Helper function so the api can be thrown directly into http.createServer
 * 
 * @param  IncomingMessage http_request
 * @param  ServerResponse http_response
 */
API.prototype.server = function (http_request, http_response) {
	var api = this;
	var body = '';

	var url = http_request.url;
	var params = url_module.parse(url, true).query;
	
	if (typeof params.fields !== "undefined" && params.fields !== null) {
		params.fields = params.fields.split(',');
	} else {
		params.fields = true;
	}

	http_request.on('readable', function () {
  		var chunk;
		while (null !== (chunk = http_request.read())) {
			body += chunk;
		}
	});

	var handleServerError = function (err) {
		// you can't predict error fields easily, so we don't apply the filter on errors
		api._onError(err)
			.writeToServer(http_response);

		http_response.end();
	};

	http_request.on('end', function () {
		// execute the api logic and retrieve the appropriate response object
		api.request(http_request.method, http_request.url, body, http_request.headers)
			.then(function (response) {
				// wrap up and write the response to the server
				response.writeToServer(http_response);
				http_response.end();
			})
			.catch(handleServerError);
	});

	// server request errors go to the unknown error representation
	http_request.on('error', handleServerError);
};