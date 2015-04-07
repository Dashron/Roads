"use strict";

/**
* api.js
* Copyright(c) 2014 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

var url_module = require('url');
var qs_module = require('querystring');
var roads = require('../index');
var Bluebird = require('bluebird');

/**
 * Road Constructor
 *
 * Creates your Road object, so you can use it directly or bind it to an [HTTP server](http://nodejs.org/api/http.html#http_http_createserver_requestlistener). 
 * 
 * @param  {Resource} root_resource Used to generate the response for the root endpoint ( [protocol]://[host]/ ).
 */
var Road = module.exports = function Road (root_resource) {
	var _self = this;
	// Coroutine creation should happen here or in the resource
	this.root_resource = root_resource;

	// ensure we have at least one resource to route to
	if (!this.root_resource) {
		throw new Error('You must configure a root resource before making requests');
	}

	this._request_chain = [];
};

Road.prototype.root_resource = null;
Road.prototype._request_chain = null;
Road.prototype._response = null;

/**
 * Use allows you to register functions to be executed before your core route is executed
 *
 * The parameters of the callback are as follows:
 *  method  | string    | The HTTP method that was provided to the request
 *  url     | string    | The url that was provided to the request
 *  body    | object    | The body that was provided to the request, after it was properly parsed into an object
 *  headers | object    | The headers that were provided to the request
 *  next    | function  | The next function in the request chain, or the final route.
 *  
 * @param {Function} fn A callback (function or generator function) that will be executed every time a request is made.
 */
Road.prototype.use = function (fn) {
	this._request_chain.push(fn);
};

/**
 * Make a request
 *
 * This function will locate the appropriate resource method for the provided parameters, execute it and return a thenable (Promises/A compatible promise, http://wiki.commonjs.org/wiki/Promises/A).
 * On success, you will receive the result of the resource method
 * On failure, you should receive an error. This error might be an HttpError
 * 
 * @param  string method
 * @param  string url     
 * @param  string body    
 * @param  array headers 
 * @return string
 */
Road.prototype.request = function (method, url, body, headers) {
	var next = null;
	var route = null;
	var _self = this;

	if (typeof method !== "string") {
		throw new Error('You must provide an HTTP method when making a request');
	}

	if (typeof url !== "string") {
		throw new Error('You must provide a url when making a request');
	}

	// Create an empty headers object if no value is provided
	if (!headers) {
		headers = {};
	}

	try {
		url = url_module.parse(url, true);
		body = this._parseBody(body, headers['content-type']);
	} catch (e) {
		// todo: maybe we can make this better, and incorporate it with the _locateRoute method
		return new roads.Promise(function (resolve, reject) {
			reject(e);
		});
	}

	route = this._buildRoute(method, url, body, headers);
	
	// execute the route and ensure the promise resolves to a Response object
	return this._executeRoute(route);
};

/**
 * Translate the request body into a usable object or array
 * 
 * @param  mixed  body         
 * @param  string content_type
 * @return mixed  parsed body
 */
Road.prototype._parseBody = function (body, content_type) {
	if (typeof body === "object" || Array.isArray(body) || !body) {
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
 * Turn an HTTP request into an executable function with a useful request context.
 * 
 * @param  object parsed_url
 * @param  string request_method
 * @param  object request_body
 * @param  object request_headers
 * @return function
 */
Road.prototype._buildRoute = function (request_method, parsed_url, request_body, request_headers) {
	var _self = this;
	var chain = null;
	var resource = this._locateResource(parsed_url);

	var context = {
		request : function (method, url, body, headers) {
			return _self.request(method, url, body, headers);
		},
		http_methods : resource ? resource.getValidMethods() : []
	};

	return _self._buildRequestChainQueue(context, resource, request_method, parsed_url, request_body, request_headers);
};

/**
 * 
 * @param  {[type]} context  [description]
 * @param  {[type]} resource [description]
 * @return {[type]}          [description]
 */
Road.prototype._buildRequestChainQueue = function (context, resource, method, url, body, headers) {
	var progress = -1;
	var _self = this;
	var route = null;

	var next = function () {
		progress += 1;
		if (_self._request_chain[progress]) {
			return _self._createCoroutine(_self._request_chain[progress]).call(context, method, url, body, headers, function () {
				return _self._executeRoute(next);
			});
		}

		route = _self._locateRoute(resource, method, url);
		return route.call(context, url, body, headers);
	};

	return next;
};

/**
 * Find the appropriate route for the requested pathname and method
 *
 * @param  Resource resource The resource that the parsed_url is mapped to.
 * @param  string parsed_url The requested url to route, after it has gone through url.parse
 * @param  sring method   The requested HTTP method.
 * @return function
 */
Road.prototype._locateRoute = function (resource, method, parsed_url) {
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
			// todo: this gives a really bad error message when called directly
			// we throw this so that it lines up with how all errors are handled
			throw new roads.HttpError(resource.getValidMethods(), 405);
		};
	}

	// We have to check if the function is a generator or not before we bind it, otherwise the new function doesn't pass our current "is a generator" test.
	return this._createCoroutine(resource[method]);
};

/**
 * Identify if a function is a generator, and if so translate it into a coroutine
 *
 * @todo kill bluebird dependency and use async functions
 * @param  Function fn
 * @return Function
 */
Road.prototype._createCoroutine = function (fn) {
	// iojs logged GeneratorFunctionPrototype for some reason.....
	if (fn.constructor.name === 'GeneratorFunction' || fn.constructor.name === 'GeneratorFunctionPrototype') {
		return Bluebird.coroutine(fn);
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
 * @return Promise
 */
Road.prototype._executeRoute = function (route) {
	var result = null;

	// Handle errors properly
	try {
		result = route();
	} catch (e) {
		// this should never be reached if route is a coroutine
		return new roads.Promise(function (resolve, reject) {
			reject(e);
		});
	}

	// If the result isn't a promise already, make it one
	if (!(result instanceof roads.Promise)) {
		return Promise.resolve(result);
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
Road.prototype._locateResource = function (parsed_url) {
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
			return null;
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
Road.prototype.server = function (http_request, http_response) {
	var api = this;
	var body = '';
	var _self = this;

	http_request.on('readable', function () {
  		var chunk;
		while (null !== (chunk = http_request.read())) {
			body += chunk;
		}
	});

	var writeResponse = function (response) {
		// wrap up and write the response to the server
		response.writeToServer(http_response);

		// easy curl terminal readout
		if (http_request.headers['user-agent'] && http_request.headers['user-agent'].indexOf('curl') !== -1) {
			http_response.write("\n");
		}

		http_response.end();
	};

	http_request.on('end', function () {
		// execute the api logic and retrieve the appropriate response object
		api.request(http_request.method, http_request.url, body, http_request.headers)
			.then(writeResponse);
	});

	// server request errors go to the unknown error representation
	http_request.on('error', function (err) {
		// todo: this all kinda sucks. It needs a refactor
		console.log(err);
		(new _self.Response({"error" : "An unknown error has occured"}, 500)).writeToServer(http_response);
	});
};
