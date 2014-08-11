"use strict";

/**
* response.js
* Copyright(c) 2014 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

var Promise = require('bluebird');

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
 * Retrieve the data associated with this response. Will always return a promise no matter
 * what is contained in the actual data
 * 
 * @return Promise
 */
Response.prototype.getData = function () {
	var _self = this;
	var promise = null;

	// Ensure that a promise comes out of the response, no matter the value
	if (this.data instanceof Promise) {
		promise = this.data;
	} else {
		promise = new Promise(function (resolve, reject) {
			resolve(_self.data);
		});
	}

	return promise;
};

/**
 * Helper function to write this response to the server
 * 
 * @param dynamic data
 * @param {[type]} http_response
 * @param boolean end
 */
Response.prototype.writeToServer = function(http_response) {
	http_response.writeHead(this.status, this.headers);
	http_response.write(JSON.stringify(this.data));
};