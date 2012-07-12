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
 * 
 * @param {Object} description default_route[object], catch_all[regexp], routes[array of objects]
 */
var RegexRouter = exports.RegexRouter = function RegexRouter (description) {
	this.default_route = description.default_route;
	this.catch_all = description.catch_all;

	if (Array.isArray(description.routes)) {
		var i = 0, route = null;
		this.routes = new Array(description.routes.length);

		for (i = 0; i < description.routes.length; i ++) {
			route = description.routes[i];
			this.routes[i] = {
				match: route.match, 
				route: route, 
				keys: route.keys
			}
		}
	}
};

RegexRouter.prototype.routes = null;
RegexRouter.prototype.default_route = null;
RegexRouter.prototype.catch_all = null;

/**
 * Find all the grouping matches within the provided url, and connect them with the appropriate querystring names
 * 
 * @param  {Object} keys a mapping of Number=>String
 * @param  {Array} matches response of string.match(regex)
 * @return {Object} Everything that should be added to the GET parameters
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
 * Retrieve the route best associated with the provided uri_bundle.
 * 
 * It first checks to make sure that uri_bundle.uri matches this routers catch_all function (if one is provided)
 * If not, we assume there are no routes here for this bundle.
 * 
 * It then loops through all of the regexes trying to find the proper route.
 * If one is found, we might have grouping matches from the regex.
 * We associate those with the keys object provided in addRoute, and inject them back into the uri_bundle as GET parameters
 * 
 * @param {Object} uri_bundle
 * @return {Object}
 */
RegexRouter.prototype.getRoute = function (uri_bundle) {
	var _self = this;
	var routes = _self.routes;
	var matching_route = null;
	var matches = null;
	var i = 0;

	// Provide a catch_all regex for optimization, so you can split up all your routes easily
	if (this.catch_all) {
		if (!uri_bundle.uri.match(this.catch_all)) {
			return false;
		}
	}

	if (Array.isArray(routes)) {
		for (i = 0; i < routes.length; i ++) {
			var route = routes[i].route;
			var matches = uri_bundle.uri.match(routes[i].match);

			// Ensure a regex match has been made
			if (matches != null) {
				// if the regex had groups, apply the grouped matches as GET parameters
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

	return false;
};

/**
 * If the uri bundle is acceptable for this router, the routers default route is returned
 * 
 * @param  {[type]} uri_bundle [description]
 * @return {[type]}            [description]
 */
RegexRouter.prototype.getDefaultRoute = function (uri_bundle) {
	// Provide a catch_all regex for optimization, so you can split up all your routes easily
	if (!this.catch_all) {
		return this.default_route;
	}

	if (!uri_bundle.uri.match(this.catch_all)) {
		return false;
	}

	// If there was no match, run the unmatched func
	if (typeof this.default_route != "undefined" && _self.default_route != null) {
		return this.default_route;
	}

	return false;
}
