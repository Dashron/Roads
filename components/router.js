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
RegexRouter.prototype.add = function (regex, func, options) {
	var _self = this;
	var method = "GET";

	var route_info = {
		regex : regex,
		func : func,
		keys : []
	};

	if (typeof options === "undefined") {
		options = {};
	}

	if (typeof options.method !== "undefined") {
		method = options.method;
	}

	if (typeof options.keys != "undefined") {
		route_info.keys = options.keys
	};

	if (typeof _self.routes[method] == "undefined" || typeof _self.routes[method] == null) {
		_self.routes[method] = [];
	}

	_self.routes[method].push(route_info);
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
 * [url_matches description]
 * @param  {[type]} keys    [description]
 * @param  {[type]} matches [description]
 * @return {[type]}
 */
var url_matches = function (keys, matches) {
	var GET = {};
	var i = 0;
	
	for (i = 0; i < matches.length; i++) {
		if (typeof keys[i] != "undefined") {
			GET[keys[i]] = matches[i];
		} else {
			throw new Error('Route match found without an appropriate key');
		}
	}

	return GET;
};

/**
 * [perform_route description]
 * @param  {[type]}   route    [description]
 * @param  {[type]}   request  [description]
 * @param  {[type]}   response [description]
 * @param  {Function} callback [description]
 * @return {[type]}
 */
var perform_route = function (route, request, response, callback) {
	switch (request.method) {
		case "GET" :
			route.func(request, response, callback);
			return true;
		
		case "POST" :
		case "PUT" :
		// Does delete go here? @todo read the spec
		case "DELETE" :
			request.on('end', function () {
				route.func(request, response, callback);
			});
			return true;
			
		default :
			console.log('unsupported method ' + request.method);
			response.notFound();
			return true;
	}
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
	var routes = _self.routes[request.method];
	var i =0;

	if (Array.isArray(routes)) {
		for (i = 0; i < routes.length; i ++) {
			var route = routes[i];
			var result = request.url('pathname').match(route.regex);
				
			if (result != null && result.length) {
				var extra_get_vals = {};
				
				match_found = true;

				// First element is always the whole item
				result.shift();
				extra_get_vals = url_matches(route.keys, result);
				for(var key in extra_get_vals) {
					request.GET[key] = extra_get_vals[key];
				};
				
				perform_route(route, request, response, callback);
				return true;
			}
		};
	}

	// If there was no match, run the unmatched func
	if (!match_found && typeof _self.unmatched === "function") {
		_self.unmatched(request, response, callback);
		return true;
	}

	return false;
};
