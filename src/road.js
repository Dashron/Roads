"use strict";
/**
 * road.js
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 * 
 * Exposes the core Road class
 */

const roads = require('./index.js');
const response_lib = require('./response.js');

/**
 * See roadsjs.com for full docs.
 * 
 * @name Road
 */
module.exports = class Road {

	/**
	 * Road Constructor
	 *
	 * Creates a new Road class. This function does not accept any parameters!
	 */
	constructor () {
		this._request_chain = [];
	}

	/**
	 * Add one or many custom functions to be executed along with every request.
	 *
	 * The functions added will be executed in the order they were added. Each handler must execute the "next" parameter if it wants to continue executing the chain.
	 *
	 * name | type                                                                  | required | description
	 * -----|-----------------------------------------------------------------------|----------|---------------
	 * fn   | Function(*string* method, *string* url,*string* body,*object* headers,*function* next) | yes      | Will be called any time a request is made on the object.
	 * 
	 * This will be called for every request, even for routes that do not exist. The callback will be executed with the following five parameters :
	 * 
	 * Callback 
	 * **function (*string* method, *string* url, *string* body, *Object* headers, *Function* next)**
	 *
	 * name     | type                               | description
	 * --------|------------------------------------|---------------
	 * method  | string                             | The HTTP method that was provided to the request
	 * url     | string                             | The URL that was provided to the request
	 * body    | string                             | The body that was provided to the request
	 * headers | object                             | The headers that were provided to the request
	 * next    | function                           | The next step of the handler chain. If there are no more custom handlers assigned, next will resolve to the [resource method](#resource-method) that the router located. This method will always return a promise.
	 *
	 * If the callback does not return a [response](#roadsresponse) object, it will be wrapped in a [response](#roadsresponse) object with the default status code of 200.
	 *  
	 * @param {function} fn - A callback (function or async function) that will be executed every time a request is made.
	 * @returns {Road} this road object. Useful for chaining use statements.
	 */
	use (fn) {
		if (!fn || typeof(fn) !== "function") {
			throw new Error('You must provide a valid function to the use method');
		}
		
		// Currently we pass everything through the coroutine wrapper to be save. Let that library decide what does and does not actually need to be wrapped
		this._request_chain.push(fn);

		return this;
	}

	/**
	 *
	 * Execute the resource method associated with the request parameters.
	 *
	 * This function will locate the appropriate [resource method](#resource-method) for the provided HTTP Method and URL, execute it and return a [thenable (Promises/A compatible promise)](http://wiki.commonjs.org/wiki/Promises/A). The thenable will always resolve to a [Response](#roadsresponse) object.
	 * 
	 * @param {string} method - HTTP request method
	 * @param {string} url - HTTP request url
	 * @param {string} [body] - HTTP request body
	 * @param {array} [headers] - HTTP request headers
	 * @returns {Promse} this promise will resolve to a Response object
	 */
	request (method, url, body, headers) {
		if (typeof(method) !== "string") {
			throw new Error('You must provide an HTTP method when making a request');
		}

		if (typeof(url) !== "string") {
			throw new Error('You must provide a url when making a request');
		}

		return response_lib.wrap(this._buildNext(method, url, body, headers, {
			request: this.request.bind(this),
			Response: roads.Response
		})());
	}

	/**
	 * Turn an HTTP request into an executable function with a useful request context. Will also incorporate the entire
	 * request handler chain
	 *
	 * @param {string} request_method - HTTP request method
	 * @param {string} path - HTTP request path
	 * @param {string} request_body - HTTP request body
	 * @param {object} request_headers - HTTP request headers
	 * @param {object} context - Request context
	 * @returns {function} A function that will start (or continue) the request chain
	 */
	_buildNext (request_method, path, request_body, request_headers, context) {
		let _self = this;
		let progress = 0;
		let route_fn = null;

		let next = () => {
			if (_self._request_chain.length && _self._request_chain[progress]) {
				route_fn = _self._request_chain[progress].bind(context, request_method, path, request_body, request_headers, () => {
					
					progress += 1;
					return next();
				});

			} else {
				// If next is called and there is nothing next, we should still return a promise, it just shouldn't do anything
				route_fn = () => {};
			}

			return _self._executeRoute(route_fn);
		};

		return next;
	}

	/**
	 * Execute a resource method, and ensure that a promise is always returned
	 * 
	 * @param {function} route
	 * @returns {Promise}
	 */
	_executeRoute (route) {
		let result = null;

		// Handle errors properly
		try {
			result = route();
		} catch (e) {
			// this should never be reached if route is a coroutine. This will only be reached if the route is function that throws an error.
			return new roads.Promise((resolve, reject) => {
				reject(e);
			});
		}

		// If the result isn't a promise already, make it one for consistency
		if (!(result instanceof roads.Promise)) {
			result = Promise.resolve(result);
		}

		return result;
	}
};
