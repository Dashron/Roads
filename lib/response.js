"use strict";

/**
* response.js
* Copyright(c) 2014 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

var roads = require('../index.js');

var Response = module.exports = function Response (data, status, headers) {
	this.data = data;
	this.status = status || 200;
	this.headers = headers || {};

	if (!this.headers['content-type']) {
		this.headers['content-type'] = 'application/json';
	}
};

/**
 * Holds all response information
 * @type Object
 */
Response.prototype.data = null;

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
	http_response.writeHead(this.status, this.headers);
	
	if (typeof(this.data) === "object") {
		http_response.write(JSON.stringify(this.data));
	} else {
		http_response.write(this.data);
	}
};