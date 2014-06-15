"use strict";

/**
* api.js
* Copyright(c) 2014 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

var url_module = require('url');
var Promise = require('bluebird');
var Response = require('./response').Response;

var API = module.exports.API = function API () {
	this.resources = {};
	this.representations = {};
};

API.prototype.resources = null;
API.prototype.representations = null;

API.prototype.GET = function (request) {
	return this.request('GET', request.url, request.body, request.headers);
};

API.prototype.POST = function (request) {
	return this.request('POST', request.url, request.body, request.headers);
}

API.prototype.PUT = function (request) {
	return this.request('PUT', request.url, request.body, request.headers);
}

API.prototype.DELETE = function (request) {
	return this.request('DELETE', request.url, request.body, request.headers);
}

API.prototype.PATCH = function (request) {
	return this.request('PATCH', request.url, request.body, request.headers);
}

API.prototype.OPTIONS = function* (request) {
	if (request.headers['request-target'] === '*') {
		// applies to server
		return;
	}

	var OptionsRepresentation = new this.representations['options']();
	var resource = this.locateResource(request.url.path);

	// this is not explicitly defined in the spec, we arbitrarily return an options representation object 
	var resource_methods = resource.getValidMethods();
	var response = new Response(OptionsRepresentation(resource_methods));

	response.headers.allow = resource_methods;
	response.status = 200;

	return response;
};

/**
 * Make a request into the API
 * 
 * @param  string method
 * @param  string url     
 * @param  string body    
 * @param  array headers 
 * @return string
 */
API.prototype.request = function (method, url, body, headers) {
	var api = this;

	if (!this.rootResource) {
		throw new Error('You must configure a root resource before making API requests');
	}

	if (!this.representations.errors.notFound) {
		throw new Error('You must configure a notFound representation before making API requests');
	}

	url = url_module.parse(url, true);

	var resource = this.locateResource(url.pathname);
	var response = null;

	if (resource) {
		if (resource.allowsMethod(method)) {
			return resource[method](url, body, headers);
		} else {
			// we should always return a promise out of here
			return Promise.coroutine(function* () {
				return new Response(api.representations.errors.notAcceptable());	
			})();
		}
	} else {
		// we should always return a promise out of here
		return Promise.coroutine(function* () {
			return new Response(api.representations.errors.notFound(url));
		})();
	}
};

/**
 * Route the pathname directly to a resource object
 * 
 * @param  string pathname
 * @return Resource
 */
API.prototype.locateResource = function (pathname) {
	// this will cause issues
	var parts = pathname.split('/');
	// the uri starts with a forward slash, so we will have an empty string at the start of the array
	var part = parts.shift();

	var resource = this.rootResource;

	// loop through every part separated by slashes and incrementally check them against the routes
	while (parts.length) {
		part = parts.shift();
		resource = resource.getResource(part);

		if (!resource) {
			return false;
		}
	}

	return resource;
}