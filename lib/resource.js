"use strict";

/**
* resource.js
* Copyright(c) 2014 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */
var VALID_METHODS = ['GET','HEAD','POST','PUT','DELETE','OPTIONS', 'PATCH'];

//TODO: add direct spec references
var Resource = module.exports = function Resource (definition) {
	this.routes = definition.resources;
	this.valid_methods = [];

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
 * [loadRepresentations description]
 * @param  {[type]} representations [description]
 * @return {[type]}                 [description]
 */
Resource.prototype.loadRepresentations = function (representations) {
	this.representations = representations;
	
	for (var key in this.routes) {
		this.routes[key].loadRepresentations(representations);
	}
}

/**
 * [allowedMethod description]
 * @param  {[type]} method [description]
 * @return {[type]}        [description]
 */
Resource.prototype.allowsMethod = function (method) {
	return this.valid_methods.indexOf(method) != -1;
};

/**
 * [getValidMethods description]
 * @return {[type]} [description]
 */
Resource.prototype.getValidMethods = function () {
	return this.valid_methods;
};

/**
 * [getResource description]
 * @param  {[type]} request_url [description]
 * @return {[type]}             [description]
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
			if (!isNaN(Number(request_url))) {
				return {
					key : url_part[0].substring(0),
					value : url_part,
					route : this.routes[url_part]
				};
			}
			continue;
		}

		if (url_part[0] === '$') {
			return {
				key : url_part[0].substring(0),
				value : url_part,
				route : this.routes[url_part]
			};
			continue;
		}
	}

	return false;
}

/**
 * [OPTIONS description]
 * @type {[type]}
 */
Resource.prototype.OPTIONS = function* (url, body, headers) {
	if (headers['request-target'] === '*') {
		// applies to server
		return;
	}

	var OptionsRepresentation = this.representations.options;

	// this is not explicitly defined in the spec, we arbitrarily return an options representation object 
	var resource_methods = resource.getValidMethods();

	return new Response(OptionsRepresentation(resource_methods), 200, {
		allow : resource_methods.join(',')
	});
}