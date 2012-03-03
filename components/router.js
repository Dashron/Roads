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
		fn : func,
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
/*RegexRouter.prototype.route = function (request, response, callback) {
	var _self = this;
	return _self.getRoute(request, function (route) {
		route.call(null, request, response, callback);
	});
};*/

/**
 * Retrieves a route function to be executed at a later time. 
 * Only calls the callback, providing the route if the request is ready to be routed
 * 
 * @todo  why have a promise? if we are doing a uri bundle we don't have to wait for anything
 * @param  {[type]}   request  [description]
 * @param  {Function} ready first parameter is provided the route function. not called until you can safely execute it.
 * @return {[type]}
 */
RegexRouter.prototype.getRoute = function (uri_bundle) {
	var _self = this;
	var routes = _self.routes[uri_bundle.method];
	var matching_route = null;
	var matches = null;
	var i = 0;

	// Find a match and add any regex matches into the GET params
	if (Array.isArray(routes)) {
		for (i = 0; i < routes.length; i ++) {
			var route = routes[i];
			var matches = uri_bundle.uri.match(route.regex);

			if (matches != null) {
				// apply grouped matches as GET key value pairs
				if (matches.length > 1) {
					var extra_get_vals = {};

					// First element is always the matched selection, and not a group
					matches.shift();
					
					extra_get_vals = url_matches(route.options.keys, matches);

					for(var key in extra_get_vals) {
						uri_bundle.params[key] = extra_get_vals[key];
					};
				}

				return route.fn;
			}
		};
	}

	// If there was no match, run the unmatched func
	if (typeof _self.unmatched === "function") {
		console.log('unmatched route');
		return _self.unmatched;
	}

	return false;
};