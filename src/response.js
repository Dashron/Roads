"use strict";


/**
* response.js
* Copyright(c) 2017 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

module.exports.Response = class Response {
	/**
	 * Creates a new Response object. 
	 * 
	 * @param  string body
	 * @param  number status
	 * @param  object headers
	 * @return
	 */
	constructor (body, status, headers) {
		this.body = body;
		this.status = status || 200;
		this.headers = headers || {};
	}
};

/**
 * Wraps the return value of a promise in a Response object to ensure consistency.
 * 
 * @param  Promise promise
 * @return Promise
 */
module.exports.wrap = function (promise) {
	return promise.then((route_response) => {
		if (typeof(route_response) !== "object" || !(route_response instanceof module.exports.Response)) {
			// we should always return a response object
			route_response = new module.exports.Response(route_response);
		}

		return route_response;
	});
};
