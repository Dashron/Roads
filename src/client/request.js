"use strict";

/**
* client.js
* Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

var http = require('http');

module.exports = class Request {
	constructor (host, port) {
		this.host = host;
		this.port = port;
	}
	
	request (method, path, body, headers) {
		if (!headers) {
			headers = {};
		}

		return new Promise((accept, reject) => {
			if (body && typeof(body) !== "string") {
				headers['content-type'] = 'application/json';
				body = JSON.stringify(body);
			}

			var req = http.request({
				hostname: this.host,
				port: this.port,
				path: path,
				method: method,
				headers: headers,
				withCredentials: true
			}, this._responseHandler(accept));

			req.on('error', reject);

			if (body) {
				req.write(body);
			}

			req.end();
		});
	}

	_responseHandler (accept) {
		var client = this;
	
		return (response) => {
			var response_body = '';
	
			response.on('data', function (chunk) {
				response_body += chunk;
			});
	
			response.on('end', function () {
				accept({
					body: client._decodeBody(response_body, response.headers),
					headers: response.headers,
					status: response.statusCode
				});
			});
		};
	}
	
	_decodeBody (body, headers) {
		switch (headers['content-type']) {
			case 'application/json':
				return JSON.parse(body);
			default: 
				return body;
		}
	}
};