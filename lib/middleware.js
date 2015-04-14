"use strict";
var Response = require('./response');

/**
 * Any requests with trailing slashes will immediately return a Response object redirecting to a non-trailing-slash path
 */
module.exports.killSlash = function (method, url, body, headers, next) {
	var _self = this;
	this.Response = Response;

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
