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

	/**
	 * Helper function to write this response to the server
	 * 
	 * @param dynamic data
	 * @param ServerResponse http_response
	 * @param boolean end
	 */
	writeToServer (http_response) {
		if (typeof(this.headers['content-type']) !== "string" && typeof(this.body) === "object") {
			this.headers['content-type'] = 'application/json';
		}

		http_response.writeHead(this.status, this.headers);
		
		if (this.body === null) {
			return;
		}	
		else if (typeof(this.body) === "object") {
			http_response.write(JSON.stringify(this.body));
		} else if (this.body !== undefined) {
			http_response.write(this.body);
		}
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
