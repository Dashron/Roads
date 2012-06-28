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
var RegexRouter = exports.RegexRouter = function RegexRouter (catch_all) {
	this.routes = [];
	this.unmatched_route = null;
	this.catch_all = catch_all
};

/**
 * @type {Array}
 */
RegexRouter.prototype.routes = null;

/**
 * @type {Function}
 */
RegexRouter.prototype.unmatched_route = null;

/**
 * This regex should match any route contained within this object.
 * @type {RegExp}
 */
RegexRouter.prototype.catch_all = null;

/**
 * [addRoutes description]
 * @param {[type]} regex   [description]
 * @param {Object} routes  Mapping of Method => Route Function
 * @param {[type]} options [description]
 */
RegexRouter.prototype.addRoute = function (match, route, keys) {
	this.routes.push({
		match: match, 
		route: route, 
		keys: keys
	});
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
	if (Array.isArray(keys)) {
		for (i = 0; i < matches.length; i++) {
			if (typeof keys[i] != "undefined") {
				GET[keys[i]] = matches[i];
			} else {
				throw new Error('Route match found without an appropriate key');
			}
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
	var routes = _self.routes;
	var matching_route = null;
	var matches = null;
	var i = 0;

	if (this.catch_all) {
		if (!uri_bundle.uri.match(this.catch_all)) {
			return false;
		}
	}

	// Find a match and add any regex matches into the GET params
	if (Array.isArray(routes)) {
		for (i = 0; i < routes.length; i ++) {
			var route = routes[i].route;
			var matches = uri_bundle.uri.match(routes[i].match);

			// Ensure a regex match has been made, and there is support for the requested method
			if (matches != null) {
				// apply grouped matches as GET key value pairs
				if (matches.length > 1) {
					if (typeof uri_bundle.params != "object") {
						uri_bundle.params = {};
					}
					
					var extra_get_vals = {};

					// First element is always the matched selection, and not a group
					matches.shift();

					extra_get_vals = url_matches(routes[i].keys, matches);

					for(var key in extra_get_vals) {
						uri_bundle.params[key] = extra_get_vals[key];
					};
				}

				return route;
			}
		};
	}

	// If there was no match, run the unmatched func
	if (typeof _self.unmatched_route === "function") {
		console.log('unmatched route');
		return _self.unmatched_route;
	}

	return false;
};
