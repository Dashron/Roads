"use strict";
var roads = require('../index.js');

/**
 * Any requests with trailing slashes will immediately return a Response object redirecting to a non-trailing-slash path
 */
module.exports.killSlash = function (method, url, body, headers, next) {
	var _self = this;

	// kill trailing slash as long as we aren't at the root level
	if (url.path !== '/' && url.path[url.path.length - 1] === '/') {
		return new Promise(function (accept, reject) {
			accept (new _self.Response(null, 302, {
				location : url.path.substring(0, url.path.length - 1)
			}));
		});
	}

	return next();
};

/**
 * Apply proper cors headers
 */
module.exports.cors = function (allow_origins, allow_headers) {
	if (!allow_origins || (allow_origins !== '*' && !Array.isArray(allow_origins))) {
		throw new Error('You must define the origins allowed by these cors requests as "*" or an array of valid origins');
	}

	allow_headers = allow_headers ? allow_headers : [];

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

					// if the requested method is not an allowed cors method, fail
					if (!allowed_origin || cors_methods.indexOf(headers['access-control-request-method']) === -1) {
						return new Promise(function (resolve, reject) {
							reject(new roads.HttpError(cors_methods, 405));
						});
					}

					// todo: find a good way to properly validate 'access-control-request-headers'

					return new Promise(function (resolve, reject) {
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
		.then(function (response) {
			if (!headers.origin) {
				return response;
			}

			if (cors_headers.length) {
				response.headers['Access-Control-Expose-Headers'] = cors_headers.join(', ');
			}

			response.headers['Access-Control-Allow-Origin'] = locateOrigin(headers.origin, allow_origins, cors_methods);
			response.headers['Access-Control-Allow-Credentials'] = true;
			return response;
		});
	};
};

function locateOrigin(origin, allowed_origins, cors_methods) {
	if (allowed_origins === '*') {
		return '*';
	} else if (Array.isArray(allowed_origins)) {
		var i = allowed_origins.indexOf(origin);
		if (i === -1) {
			// Origin not allowed
			return false
		}
		return allowed_origins[i];
	} else {
		throw new Error('Misconfigured CORS middleware. allow_origins must be * or an array');
	}
}