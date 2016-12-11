"use strict";

/**
* simpleRouter.js
* Copyright(c) 2016 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */
module.exports = class SimpleRouter {
	constructor () {
		this.routes = [];
	}

	/**
	 * [applyMiddleware description]
	 * @param  {[type]} road [description]
	 * @return {[type]}      [description]
	 */
	applyMiddleware (road) {
		var _self = this;
		road.addRoute = this.addRoute.bind(this);

		road.use(function (request_method, request_url, request_body, request_headers, next) {
			return _self.middleware.call(this, _self.routes, request_method, request_url, request_body, request_headers, next);
		});
	}

	/**
	 * [addRoute description]
	 * @param {[type]}   method [description]
	 * @param {[type]}   path   [description]
	 * @param {Function} fn     [description]
	 */
	addRoute (method, path, fn) {
		this.routes.push({
			path: path,
			method: method,
			fn: fn
		});
	}

	/**
	 * [middleware description]
	 * @param  {[type]}   routes          [description]
	 * @param  {[type]}   request_method  [description]
	 * @param  {[type]}   request_url     [description]
	 * @param  {[type]}   request_body    [description]
	 * @param  {[type]}   request_headers [description]
	 * @param  {Function} next            [description]
	 * @return {[type]}                   [description]
	 */
	middleware (routes, request_method, request_url, request_body, request_headers, next) {
		let context = this;
		let response = null;
		let hit = false;

		for (let i = 0; i < this.routes.length; i++) {
			let route = this.routes[i];
			if (route.path === request_url.path && route.method === request_method) {
				response = (route.fn).call(context, request_method, request_url, request_body, request_headers, next);
				hit = true;
				break;
			}
		}

		if (hit) {
			return response;
		}

		return next();
	}
};