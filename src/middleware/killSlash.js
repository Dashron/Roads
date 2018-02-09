"use strict";
/**
* killSlash.js
* Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

/**
 * Any requests with trailing slashes will immediately return a Response object redirecting to a non-trailing-slash path
 */
module.exports = function (method, url, body, headers, next) {
	let _self = this;

	// kill trailing slash as long as we aren't at the root level
	if (url.path !== '/' && url.path[url.path.length - 1] === '/') {
		return new Promise((resolve) => {
			resolve (new _self.Response(null, 302, {
				location : url.path.substring(0, url.path.length - 1)
			}));
		});
	}

	return next();
};