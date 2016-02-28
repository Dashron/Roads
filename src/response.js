"use strict";
/**
* response.js
* Copyright(c) 2016 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

module.exports = class Response {
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
		
		if (typeof(this.body) === "object") {
			http_response.write(JSON.stringify(this.body));
		} else {
			http_response.write(this.body);
		}
	}
};