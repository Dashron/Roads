"use strict";

/**
* simpleRouter.js
* Copyright(c) 2017 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */
module.exports = class SimpleRouter {
	constructor (road) {
		this.routes = [];
		if (road) {
			this.applyMiddleware(road);
		}
	}

	/**
	 * [applyMiddleware description]
	 * @param  {[type]} road [description]
	 * @return {[type]}      [description]
	 */
	applyMiddleware (road) {
		var _self = this;

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

		for (let i = 0; i < routes.length; i++) {
			let route = routes[i];

			if (compareRouteAndApplyArgs(route, request_url, request_method)) {
				response = (route.fn).call(context, request_url, request_body, request_headers, next);
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

function compareRouteAndApplyArgs (route, request_url, request_method) {
	if (route.method != request_method) {
		return false;
	}

	let template = route.path.split('/').slice(1); // Slice kills the emptystring before the leading slash
	let actual = request_url.pathname.split('/').slice(1); // Slice kills the emptystring before the leading slash

	if (template.length != actual.length) {
		return false;
	}

	for (let i = 0; i < template.length; i++) {
		let actual_part = actual[i];
		let template_part = template[i];
		
		// Process variables first
		if (template_part[0] === '#') {
			// # templates only accept numbers
			if (isNaN(Number(actual_part))) {
				return false;
			}

			applyArg(request_url, template_part.substring(1), Number(actual_part));
			continue;
		}

		if (template_part[0] === '$') {
			// $ templates accept any non-slash alphanumeric character
			applyArg(request_url, template_part.substring(1), String(actual_part));
			// Continue so that 
			continue;
		}

		// Process exact matches second
		if (actual_part === template_part) {
			continue;
		}

		return false;
	}

	return true;
}

function applyArg(request_url, template_part, actual_part) {
	if (request_url.args == undefined) {
		request_url.args = {}
	}

	if (typeof request_url.args != "object") {
		throw new Error("The request url's args have already been defined as a " + typeof request_url.args + " and we expected an object. For safety we are throwing this error instead of overwriting your existing data. Please use a different field name in your code");
	}

	request_url.args[template_part] = actual_part;
}
