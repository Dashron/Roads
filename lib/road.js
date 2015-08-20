"use strict";

/**
* api.js
* Copyright(c) 2015 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

var url_module = require('url');
var qs_module = require('querystring');
var roads = require('../index');
var coroutine = require('roads-coroutine');

/**
 * Road Constructor
 *
 * A Road is a container that holds a hierarchy of [Resource](#roadsresource) objects. It exposes a [request](#requeststring-method-string-url-dynamic-body-object-headers) method which allows you to interact directly with the resources.
 *
 * You must provide at least one root resource to the constructor. The request method will check each resource in array order for a matching route. The root resources will handle all requests to the root (`/`) endpoint. Any additional routes will be referenced as sub-resources of the root endpoint.
 * 
 * @param  {Resource|Array} root_resources When making a request, we will attempt to find routes as defined in this list of resources
 */
var Road = module.exports = function Road (root_resources) {
	var _self = this;

	if (!Array.isArray(root_resources)) {
		root_resources = [root_resources];
	}

	// Ensure everything is valid
	for (var i = 0; i < root_resources.length; i++) {
		if (!(root_resources[i] instanceof roads.Resource)) {
			throw new Error('You must configure at least one root resource when constructing your Road');
		}
	}

	// Coroutine creation should happen here or in the resource
	this.root_resources = root_resources;
	this._request_chain = [];
};

Road.prototype.root_resources = null;
Road.prototype._request_chain = null;

/**
 * Add another resource object to this road. This resource will be checked in addition
 * to the resources added via the constructor any time that a request is made on this road.
 * @param {Resource} resource
 */
Road.prototype.addResource = function (resource) {
	this.root_resources.push(resource);
};

/**
 * Add one or many custom functions to be executed along with every request.
 *
 * The functions added will be executed in the order they were added. Each handler must execute the "next" parameter if it wants to continue executing the chain.
 *
 * name | type                                                                  | required | description
 * -----|-----------------------------------------------------------------------|----------|---------------
 * fn   | Function(*string* method, *string* url,*object* body,*object* headers,*function* next) | yes      | Will be called any time a request is made on the object.
 * 
 * This will be called for every request, even for routes that do not exist. The callback will be executed with the following five parameters :
 * 
 * Callback 
 * **function (*string* method,*string* url, *Object* body, *Object* headers, *Function* next)**
 *
 * name     | type                               | description
 * --------|------------------------------------|---------------
 * method  | string                             | The HTTP method that was provided to the request
 * url     | string                             | The URL that was provided to the request
 * body    | object                             | The body that was provided to the request, after it was properly parsed into an object
 * headers | object                             | The headers that were provided to the request
 * next    | function                           | The next step of the handler chain. If there are no more custom handlers assigned, next will resolve to the [resource method](#resource-method) that the router located. This method will always return a promise.
 *
 * If the callback does not return a [response](#roadsresponse) object, it will be wrapped in a [response](#roadsresponse) object with the default status code of 200.
 *  
 * @param {Function} fn A callback (function or generator function) that will be executed every time a request is made.
 */
Road.prototype.use = function (fn) {
	if (!fn) {
		throw new Error('You must provide a valid function to the use method');
	}
	
	this._request_chain.push(fn);
};

/**
 *
 * Execute the resource method associated with the request parameters.
 *
 * This function will locate the appropriate [resource method](#resource-method) for the provided HTTP Method and URL, execute it and return a [thenable (Promises/A compatible promise)](http://wiki.commonjs.org/wiki/Promises/A). The thenable will always resolve to a [Response](#roadsresponse) object.
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
		return new roads.Promise(function (resolve, reject) {
			reject(e);
		});
	}

	return this._buildRoute(method, url, body, headers)()
	.then(function (route_response) {
		if (typeof(route_response) !== "object" || !(route_response instanceof roads.Response)) {
			// we should always return a response object
			route_response = new roads.Response(route_response);
		}

		return route_response;
	});
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
 * Turn an HTTP request into an executable function with a useful request context. Will also incorporate the entire
 * request handler chain
 *
 * @param  string request_method
 * @param  object parsed_url
 * @param  object request_body
 * @param  object request_headers
 * @return function
 */
Road.prototype._buildRoute = function (request_method, parsed_url, request_body, request_headers) {
	var _self = this;
	var resource = null;
	var first_resource = null;
	var found_methods = [];
	var route = null;

	for (var i = 0; i < this.root_resources.length; i++) {
		resource = this._locateResource(this.root_resources[i], parsed_url);

		if (resource) {
			// Keep track of the first matching resource. This is used for 405's so that we have a more useful request context.
			if (!first_resource) {
				first_resource = resource;
			}

			// Found resources keeps track of all of the resource hits so we can give accurate 405 error codes.
			found_methods = found_methods.concat(resource.getValidMethods());

			if (resource[request_method]) {
				route = resource[request_method];
				break;
			}
		}
	}

	// If we could not find any appropriate resources, 404 not found
	if (found_methods.length === 0) {
		route = function () {
			// we throw this so that it lines up with how all errors are handled
			throw new roads.HttpError(parsed_url.pathname, 404);
		};
	// If we found a resource, but could find the appropriate route, 405 Method not allowed
	} else if (!route) {
		route = function () {
			// todo: this gives a really bad error message when called directly
			// we throw this so that it lines up with how all errors are handled
			throw new roads.HttpError(found_methods, 405);
		};
		// Override the resource to use the first resource since there were valid resources, but none of them had the http method
		// we needed
		resource = first_resource;
	}

	return _self._buildRequestChainQueue(this._buildContext(resource, found_methods), route, request_method, parsed_url, request_body, request_headers);
};

/**
 * Create the request context
 * @param  Resource resource the request resource
 * @param  array valid_methods An array of valid http methods for this request
 * @return {Object}
 */
Road.prototype._buildContext = function (resource, valid_methods) {
	var _self = this;
	var context = {
		request : this.request.bind(this),
		http_methods : valid_methods,
		Response : roads.Response
	};

	if (resource) {
		context.resource_context = resource.context;
	}

	return context;
};

/**
 * Builds a single executable function that will initiate the entire request handling chain.
 * "next" will be the final parameter of every request in the chain, and the following function in the chain will
 * only execute when "next" is called.
 * 
 * @param  object context The request context
 * @param  Resource resource The request resource
 * @param  string method   The request's HTTP method
 * @param  object url      The request's parsed HTTP url
 * @param  object body     The request's HTTP body
 * @param  object headers  The request's HTTP headers
 * @return function
 */
Road.prototype._buildRequestChainQueue = function (context, route, method, url, body, headers) {
	var progress = 0;
	var _self = this;

	var next = function () {
		if (_self._request_chain.length && _self._request_chain[progress]) {
			// If you bind a generator function, it's constructor loses the "generator function" name. So we need to wrap the coroutine, 
			// and then bind the coroutine
			return _self._executeRoute(coroutine(_self._request_chain[progress]).bind(context, method, url, body, headers, function () {
				progress += 1;
				return next();
			}));
		}

		// If you bind a generator function, it's constructor loses the "generator function" name. So we need to wrap the coroutine, 
		// and then bind the coroutine
		return _self._executeRoute(coroutine(route).bind(context, url, body, headers));
	};

	return next;
};

/**
 * Execute a resource method, and ensure that a promise is always returned
 * 
 * @param  Function   route
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
 * @param  Object parsed_url
 * @return Resource
 */
Road.prototype._locateResource = function (root_resource, parsed_url) {
	var pathname = parsed_url.pathname.replace(/\/$/, '');

	// this will cause issues
	var parts = pathname.split('/');

	// the uri starts with a forward slash, so we will have an empty string at the start of the array
	var part = parts.shift();

	var resource = root_resource;
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
 * Helper function so the road can be bound directly into http.createServer
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
			.then(writeResponse)
			.catch(function (error) {
				console.log(error);
				if (error instanceof roads.HttpError) {
					writeResponse(new roads.Response({"error": error.message}, error.code));
				} else {
					writeResponse(new roads.Response({"error" : "An unknown error has occured"}, 500));
				}
			});
	});

	// server request errors go to the unknown error representation
	http_request.on('error', function (err) {
		console.log(err);
		writeResponse(new roads.Response({"error" : "An unknown error has occured"}, 500));
	});
};
