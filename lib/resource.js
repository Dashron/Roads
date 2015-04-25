"use strict";

/**
* resource.js
* Copyright(c) 2014 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */
var VALID_METHODS = ['GET','HEAD','POST','PUT','DELETE','OPTIONS', 'PATCH'];
var roads = require('../index.js');


/**
 * Each resource represents a single endpoint. The object provided to the constructor describes how it can be used by the road.
 *
 * The definition only looks for three fields.
 * 
 * name        | type                               | description
 * -----------|------------------------------------|---------------
 * resources  | object                             | Each key is a [URL part](#url-part), and each value is a sub-[resource](#roadsresource)
 * methods    | object                             | Each key is an HTTP method, and each value is a [resource method](#resource-method).
 * context    | mixed                              | The value of the Resource context will appear in the [context](#context) of every [resource method](#resource-method) with the key `resource_context`
 * 
 * @param  Object definition A collection of information about this resource. See the constructor documentation, or README.md for more
 */
var Resource = module.exports = function Resource (definition) {
	this.routes = definition.resources;
	this.valid_methods = [];
	this._init = definition.init;
	this.context = definition.context;

	if (definition.methods) {
		var method = null;
		for (var i = 0, meth_len = VALID_METHODS.length; i < meth_len; i++) {
			method = VALID_METHODS[i];

			if (definition.methods[method]) {
				this[method] = definition.methods[method];
				this.valid_methods.push(method);
			}
		}
	}
};

/**
 * Checks if this resource has a resource method for the HTTP method provided
 * 
 * @param  string method
 * @return boolean
 */
Resource.prototype.allowsMethod = function (method) {
	return this.valid_methods.indexOf(method) !== -1;
};

/**
 * Returns an array of all valid HTTP methods for this resource
 * @return array
 */
Resource.prototype.getValidMethods = function () {
	return this.valid_methods;
};

/**
 * Checks to see if the request_url provided (a single part of a url, split by slashes) matches any of this resources sub routes
 * 
 * @param  string request_url
 * @return Object|false False if no route is found. And object with routing information if true. The routing information contains three keys, key (the name of the url part variable), value (the value of the parsed_url that matches the key) and route (the located route).
 */
Resource.prototype.getResourceKey = function (request_url) {
	if (!request_url) {
		return false;
	}

	for (var url_part in this.routes) {
		if (request_url === url_part) {
			return {
				route : this.routes[url_part]
			};
		}

		if (url_part[0] === '#') {
			if (isNaN(Number(request_url))) {
				continue;
			} else {
				return {
					key : url_part.substring(1),
					value : Number(request_url),
					route : this.routes[url_part]
				};
			}
			continue;
		}

		if (url_part[0] === '$') {
			return {
				key : url_part.substring(1),
				value : request_url,
				route : this.routes[url_part]
			};
		}
	}

	return false;
};
