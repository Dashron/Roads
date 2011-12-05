"use strict";
var fs_module = require('fs');
var url_module = require('url');

/**
 * A url based router, the first regex matched will point to the executing
 * function
 */
var RegexRouter = exports.RegexRouter = function RegexRouter () {
	this.routes = {};
	this.unmatched = null;
};

/**
 * @type {Array}
 */
RegexRouter.prototype.routes = null;

/**
 * @type {Function}
 */
RegexRouter.prototype.unmatched = null;

/**
 * Add a route
 * 
 * @param {RegExp} regex
 * @param {Function} func
 *            the function to execute when the route is matched
 * @param {String} method
 *            optional, defaults to GET
 */
RegexRouter.prototype.add = function (regex, func, method) {
	var _self = this;

	if (method === null || typeof method === "undefined") {
		method = "GET";
	}

	if (typeof _self.routes[method] == "undefined" || typeof _self.routes[method] == null) {
		_self.routes[method] = [];
	}

	_self.routes[method].push({
		regex : regex,
		func : func
	});
};

/**
 * Assign a route which will be executed if no other routes are matched
 * 
 * @param {Function} func
 */
RegexRouter.prototype.unmatched = function (func) {
	var _self = this;

	_self.unmatched = func;
};

/**
 * Route the provided request
 * 
 * @param {HttpRequest} request
 * @param {HttpResponse} response
 * @param {Object} extra
 *            any extra data you want provided to the route function
 * @param {Function} callback
 *            a function to execute once the data has been routed
 * @return {Boolean}
 */
RegexRouter.prototype.route = function (request, response, extra, callback) {
	var _self = this;
	var url = url_module.parse(request.url, true);
	var match_found = false;
	var routes = _self.routes[request.method];

	request.url = url_module.parse(request.url, true);

	if (Array.isArray(routes)) {
		for ( var i = 0; i < routes.length; i++) {
			var result = url.pathname.match(routes[i].regex);

			if (result != null && result.length) {
				match_found = true;
				routes[i].func(request, response, extra, callback);
				break;
			}
		}
	}

	// If there was no match, run the unmatched func
	if (!match_found && typeof _self.unmatched === "function") {
		_self.unmatched(request, response, extra, callback);
		match_found = true;
	}

	return match_found;
};