/*
* gfw.js - router.js
* Copyright(c) 2011 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
*/

"use strict";
var fs_module = require('fs');
var url_module = require('url');
var qs_module = require('querystring');

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
 * @param {Request} request
 * @param {Response} response
 * @param {Object} extra
 *            any extra data you want provided to the route function
 * @param {Function} callback
 *            a function to execute once the data has been routed
 * @return {Boolean}
 * 
 * @todo return promise on success?
 * @todo routes[i].func(resource, response, extra)
 */
RegexRouter.prototype.route = function (request, response, callback) {
	var _self = this;
	var url = url_module.parse(request.url(), true);
	var match_found = false;
	var routes = _self.routes[request.method()];

	if (Array.isArray(routes)) {
		for ( var i = 0; i < routes.length; i++) {
			var result = request.url('pathname').match(routes[i].regex);

			if (result != null && result.length) {
				match_found = true;
				request.routeMatches(result);
				
				switch (request.method()) {
					case "GET" :
						routes[i].func(request, response, callback);
						return true;
					
					case "POST" :
						request.on('end', function () {
							routes[i].func(request, response, callback);
						});
						return true;
				}
			}
		}
	}

	// If there was no match, run the unmatched func
	if (!match_found && typeof _self.unmatched === "function") {
		_self.unmatched(request, response, callback);
		return true;
	}

	return false;
};