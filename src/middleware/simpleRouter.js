"use strict";
/**
* simpleRouter.js
* Copyright(c) 2016 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

var routes = [];

/**
 * Note: This doesn't handle 405's. One possible solution is to record all similar paths
 */
module.exports = function (road) {
	road.addRoute = function (path, method, fn) {
		routes.push({
			path: path,
			method: method,
			fn: fn
		});
	};

	return function (request_method, request_url, request_body, request_headers, next) {
		var context = this;
		var response = null;

		for (let i = 0; i < routes.length; i++) {
			let route = routes[i];
			if (route.path === request_url.path && route.method === request_method) {
				response = (route.fn).call(context, request_method, request_url, request_body, request_headers, next);
				break;
			}
		}

		if (response) {
			return response;
		}

		return next();
	};
};