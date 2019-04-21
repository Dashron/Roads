"use strict";
/**
 * request.js
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 * 
 * This file exposes a Request object to offer an HTTP request library with a method signature that matches
 * the roads.request method
 */

var http = require('http');
var https = require('https');

/**
 * This class is a helper with making HTTP requests. 
 * The function signature matches the roads "request" method to allow the details of a request to be abstracted
 * away from the client. Sometimes the request may route internally, sometimes it may be an HTTP request.
 * 
 * @todo tests
 */
module.exports = class Request {
	/**
	 * @todo: port should just be part of the host
	 * 
	 * @param {boolean} secure - Whether or not this request should use HTTPS
	 * @param {string} host - The hostname of all requests made by this function
	 * @param {number} port - The post of all requests made by this function
	 */
	constructor (secure, host, port) {
		this.secure = secure;
		this.host = host;
		this.port = port;
	}
	
	/**
	 * Perform the HTTP request
	 * 
	 * @param {string} method - HTTP Request method
	 * @param {string} path - HTTP Request path
	 * @param {(object|string)} [body] - The request body. If an object is provided, the body will be turned to JSON, and the appropriate content header set
	 * @param {object} [headers] - HTTP Request headers
	 * @returns {Promise} The promise will resolve with an object with three properties. The response headers, response status and the response body. If the response content-type is "application/json" the body will be an object, otherwise it will resolve to a string
	 */
	request (method, path, body, headers) {
		if (!headers) {
			headers = {};
		}

		return (new Promise((resolve, reject) => {
			if (body && typeof(body) !== "string") {
				headers['content-type'] = 'application/json';
				body = JSON.stringify(body);
			}

			var req = (secure ? https : http).request({
				hostname: this.host,
				port: this.port,
				path: path,
				method: method,
				headers: headers,
				withCredentials: true
			}, resolve);

			req.on('error', reject);

			if (body) {
				req.write(body);
			}

			req.end();
		}))
		.then((response) => {
			return new Promise((resolve, reject) => {
				var response_body = '';
		
				response.on('data', (chunk) => {
					response_body += chunk;
				});
		
				response.on('end', () => {
					resolve({
						body: this._decodeBody(response_body, response.headers),
						headers: response.headers,
						status: response.statusCode
					});
				});

				response.on('error', reject);
			});
		});
	}
	
	/**
	 * Attempts to parse the response body and return a useful object
	 * 
	 * @param {string} body - The response body
	 * @param {object} headers - The response headers
	 * 
	 * @returns {(object|string)} - The response body, parsed if json, string if not
	 */
	_decodeBody (body, headers) {
		switch (headers['content-type']) {
			case 'application/json':
				return JSON.parse(body);
			default: 
				return body;
		}
	}
};