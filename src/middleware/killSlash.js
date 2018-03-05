"use strict";
/**
 * killSlash.js
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 * 
 * Exposes a single middleware function to kill trailing slashes in HTTP requests.
 * This is done by redirecting the end user to the same route without the trailing slash.
 */

let url_module = require('url');

/**
 * Any requests with trailing slashes will immediately return a Response object redirecting to a non-trailing-slash path
 */
module.exports = function (method, url, body, headers, next) {
	let _self = this;

	let parsed_url = url_module.parse(url);
	// kill trailing slash as long as we aren't at the root level
	if (parsed_url.path !== '/' && parsed_url.path[parsed_url.path.length - 1] === '/') {
		return new Promise((resolve) => {
			resolve (new _self.Response(null, 302, {
				location : parsed_url.path.substring(0, parsed_url.path.length - 1)
			}));
		});
	}

	return next();
};