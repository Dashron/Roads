"use strict";
/**
* cors.js
* Copyright(c) 2016 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */
const roads = require('../../index.js');

/**
 * Helper function used internally to manage the origin headers
 */
function locateOrigin(origin, allowed_origins) {
	if (allowed_origins === '*') {
		return '*';
	} else if (Array.isArray(allowed_origins)) {
		let i = allowed_origins.indexOf(origin);
		if (i === -1) {
			// Origin not allowed
			return false;
		}
		return allowed_origins[i];
	} else {
		throw new Error('Misconfigured CORS middleware. allow_origins must be * or an array');
	}
}

/**
 * Apply proper cors headers
 * 
 * @param  Array|String allow_origins Either * to allow all origins, or an explicit list of valid origins.
 * @param  Array allow_headers (optional) A white list of headers that the client is allowed to send in their requests
 * @return Function The middleware to bind to your road
 */
module.exports = function (allow_origins, allow_headers) {
	if (!allow_origins || (allow_origins !== '*' && !Array.isArray(allow_origins))) {
		throw new Error('You must define the origins allowed by these cors requests as "*" or an array of valid origins');
	}

	allow_headers = allow_headers ? allow_headers : [];

	/**
	 * This function has some rebind trickery down the line, and should not be an arrow function
	 */
	return function (method, uri, body, headers, next) {
		var _self = this;
		var cors_methods = this.http_methods;
		var cors_headers = allow_headers;

		if (this.resource_context && this.resource_context.cors) {
			if (this.resource_context.cors.methods) {
				cors_methods = this.resource_context.cors.methods;
			}

			if (this.resource_context.cors.headers) {
				cors_headers.concat(this.resource_context.cors.headers);
			}
		}

		// http://www.html5rocks.com/static/images/cors_server_flowchart.png
		if (headers.origin) {
			if (method === 'OPTIONS') {
				if (headers.origin && headers['access-control-request-method']) {
					
					var allowed_origin = locateOrigin(headers.origin, allow_origins, cors_methods);
					// if the requested origin is not an allowed cors origin, fail
					if (!allowed_origin) {
						return new Promise((resolve, reject) => {
							reject(new roads.HttpError(allow_origins.join(','), 403));
						});
					}

					// if the requested method is not an allowed cors method, fail
					if (cors_methods.indexOf(headers['access-control-request-method']) === -1) {
						return new Promise((resolve, reject) => {
							reject(new roads.HttpError(cors_methods, 405));
						});
					}

					// todo: find a good way to properly validate 'access-control-request-headers'
					return new Promise((resolve) => {
						resolve(new _self.Response(null, 200, {
							'Access-Control-Allow-Methods' : _self.http_methods.join(', '),
							'Access-Control-Allow-Headers' : cors_headers.join(', '),
							'Access-Control-Allow-Origin' : allowed_origin,
							'Access-Control-Allow-Credentials' : true
						}));
					});
				}
			}
		}

		return next()
		// All responses need to include some sort of header
		.then((response) => {
			if (!headers.origin) {
				return response;
			}

			if (cors_headers.length) {
				response.headers['Access-Control-Expose-Headers'] = cors_headers.join(', ');
			}

			response.headers['Access-Control-Allow-Origin'] = locateOrigin(headers.origin, allow_origins, cors_methods);
			response.headers['Access-Control-Allow-Credentials'] = true;
			return response;
		})
		// Errors should surface the headers too
		.catch((error) => {
			if (!headers.origin) {
				throw error;
			}

			if (!error.headers) {
				error.headers = {};
			}

			if (cors_headers.length) {
				error.headers['Access-Control-Expose-Headers'] = cors_headers.join(', ');
			}

			error.headers['Access-Control-Allow-Origin'] = locateOrigin(headers.origin, allow_origins, cors_methods);
			error.headers['Access-Control-Allow-Credentials'] = true;
			throw error;
		});
	};
};
