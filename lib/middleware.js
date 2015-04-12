"use strict";
var Response = require('./response');

/**
 * A small bundle of common middleware.
 *
 * There are two primary functions
 * - First, if kill_trailing_slash, any requests with trailing slashes will immediately return a Response object redirecting to a non-trailing-slash path
 * - Second, it will the Response class to the context (ctx.Response) and if options.always_wrap_with_response, ensure the route always returns a Response object
 *
 * @param  {Object} options
 * @param  {boolean} options.kill_trailing_slash Default true. If false, this middleware will only add the Response class to the context.
 * @param  {boolean} options.always_wrap_with_response Default true. If false, this middleware will only add the Response class to the context.
 */
module.exports.standard = function (options) {
	if (!options) {
		options = {};
	}

	var kill_trailing_slash = options.kill_trailing_slash === false ? false : true;
	var always_wrap_with_response = options.always_wrap_with_response === false ? false : true;

	return function (method, url, body, headers, next) {
		var _self = this;
		this.Response = Response;

		// kill trailing slash as long as we aren't at the root level
		if (kill_trailing_slash && url.path !== '/' && url.path[url.path.length - 1] === '/') {
			return new Promise(function (accept, reject) {
				accept (new _self.Response(null, 302, {
					location : url.path.substring(0, url.path.length - 1)
				}));
			});
		}

		return next()
			.then(function (route_response) {
				if (always_wrap_with_response !== false && (typeof(route_response) !== "object" || !(route_response instanceof _self.Response))) {
					// we should always return a response object
					route_response = new _self.Response(route_response);
				}

				return route_response;
			});
	};
};
