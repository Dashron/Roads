"use strict";

/**
* response.js
* Copyright(c) 2014 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

var roads = require('../index.js');

var Response = module.exports = function Response (body, status, headers) {
	this.body = body;
	this.status = status || 200;
	this.headers = headers || {};
};

/**
 * Holds all response information
 * @type Object
 */
Response.prototype.body = null;

/**
 * All response headers
 * @type Object
 */
Response.prototype.headers = null;

/**
 * The HTTP Status code
 * @type number
 */
Response.prototype.status = null;

/**
 * Helper function to write this response to the server
 * 
 * @param dynamic data
 * @param {[type]} http_response
 * @param boolean end
 */
Response.prototype.writeToServer = function(http_response) {
	if (typeof this.headers['content-type'] !== "string" && typeof this.body === "object") {
		this.headers['content-type'] = 'application/json';
	}

	http_response.writeHead(this.status, this.headers);
	
	if (typeof(this.body) === "object") {
		http_response.write(JSON.stringify(this.body));
	} else {
		http_response.write(this.body);
	}
};