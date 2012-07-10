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

RegexRouter.prototype.routes = null;
RegexRouter.prototype.unmatched_route = null;
RegexRouter.prototype.catch_all = null;

/**
 * Add a single route to the router
 * 
 * @param {RegExp} regex regex that is associated with the provided route.
 * @param {Object} route an object containing all route details. We never touch the route here, so it can  be anything
 * @param {Objet} keys a mapping of Number=>String so that regex grouping can be put assigned as a querystring parameter
 */
RegexRouter.prototype.addRoute = function (match, route, keys) {
	this.routes.push({
		match: match, 
		route: route, 
		keys: keys
	});
};

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

RegexRouter.prototype.getUnmatchedRoute = function (uri_bundle) {
	console.log(this.catch_all);
	// Provide a catch_all regex for optimization, so you can split up all your routes easily
	if (!this.catch_all) {
		return this.unmatched_route;
	}

	if (!uri_bundle.uri.match(this.catch_all)) {
		return false;
	}

	// If there was no match, run the unmatched func
	if (typeof this.unmatched_route != "undefined" && _self.unmatched_route != null) {
		return this.unmatched_route;
	}

	return false;
}
