/*
 * gfw.js - resource.js
 * Copyright(c) 2011 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 */

"use strict";

var url_module = require('url');
var http_module = require('http');
var path_module = require('path');

var accept_header_component = require('./accept_header');
var view_component = require('./view');
var View = view_component.View;
var Router = require('./router').RegexRouter;

var _resources = {};
var _resource_dir = path_module.normalize(__dirname + '/../resources');

/**
 * Set the default directory  to load resources from
 * 
 * @param {String} directory 
 */
var set_resource_dir = exports.directory = function (directory) {
	_resource_dir = path_module.normalize(directory);
};

/**
 * Free up the memory of all resources built within this module
 */
var clear = exports.clear = function () {
	_resources = {};
};

/**
 * Constructs a resource.
 * The name provided is how the resource finds it's definition.
 * If the resource has already been constructed, it will return that one.
 * 
 * @todo : document all the description properties
 * @param {Object} description
 */
var Resource = exports.Resource = function Resource (name, description) {
	if (typeof _resources[name] === "object") {
		return _resources[name];
	}

	var key = null;

	this.name = name;
	this.directory = path_module.normalize(__dirname + '/../resources/' + this.name);
	this.template_dir = this.directory + '/templates/';
	this.config = description.config;
	this.router = description.router;
	this.resources = {};
	this.onRequest = description.onRequest;

	for (key in description.properties) {
		this[key] = description.properties[key];
	}

	for (key in description.dependencies) {
		this.resources[key] = description.dependencies[key];
	}
	
	if (typeof description.construct === "function") {
		description.construct.call(this);
	}

	_resources[name] = this;
};

Resource.prototype.name = '';
Resource.prototype.config = null;
Resource.prototype.directory = '';
Resource.prototype.template_dir = '';


/**
 * Locates the code best associated with the provided uri_bundle, and writes any necessary data to the view
 * 
 * @param  {Object} uri_bundle
 * @param  {View} view
 */
Resource.prototype.request = function (uri_bundle, view) {
	var key = null;
	var template_dir = this.template_dir;
	var route_resource = this;
	var _self = this;

	// Allow direct urls for shorthand. Assume a GET request in this case
	if (typeof uri_bundle === "string") {
		uri_bundle = {
			uri : uri_bundle,
			method : 'GET'
		}
	}

	// clean up the success path, and have processRoute return a promise
	this.processRoute(uri_bundle, function (route, route_resource) {
		// If the template provided is actually a server response, we need to build the very first view
		if (view instanceof http_module.ServerResponse) {
			var response = view;

			view = new View();
			
			// The default content type will be text/html
			if (typeof route.options.modes === "undefined" || route.options.modes === null) {
				route.options.modes = ["text/html"];
			}

			view.setContentType(accept_header_component.getContentType(uri_bundle.headers.accept, route.options.modes));
			view.setResponse(response);
		}

		// If a template is set in the config, apply it to the current view and then provide a child view to the route
		/*if (!route.options.ignore_template && typeof _self.template === "function") {
			// We don't want to set the route resources directory, we will always create the template from the resource upon which request is called
			view.dir = _self.template_dir;
			var child = view.child('content');
			_self.template(view);
			view = child;
		}*/

		// assume that we want to load templates directly from this route, no matter the data provided
		view.dir = route_resource.template_dir;

		// route, allowing this to point to the original resource, and provide some helper utils
		if (typeof route[uri_bundle.method] == "function") {
			// Route to the proper method
			process.nextTick(function() {
				if (typeof route_resource.onRequest === "function") { 
					route_resource.onRequest(uri_bundle, view, route[uri_bundle.method], route_resource);
				} else if (typeof this.onRequest === "function") {
					this.onRequest(uri_bundle, view, route[uri_bundle.method], route_resource);
				} else {
					route[uri_bundle.method].call(route_resource, uri_bundle, view);
				}
			});
		} else if (typeof route['default'] === "function") {
			// Allow default routes in case the method is not explicitly stated
			process.nextTick(function() {
				if (typeof route_resource.onRequest === "function") { 
					route_resource.onRequest(uri_bundle, view, route.default, route_resource);
				} else if (typeof this.onRequest === "function") {
					this.onRequest(uri_bundle, view, route.default, route_resource);
				} else {
					route.default.call(route_resource, uri_bundle, view);
				}
			});
		} else {
			// Handle the unsupportedMethod http response, and provide the allowed methods
			var keys = [];
			['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'].forEach(function (option) {
				if (typeof route[option] === "function") {
					keys.push(option)
				}
			});
			view.statusUnsupportedMethod(keys);
		}
	}, function () {
		// Yes, dying horribly is intended here. This bit of code should never be executed
		// The ideal technique would be for your root resource to have an unmatched_route property
		// that handles all 404's
		throw new Error('route not found :' + uri_bundle.uri + ' [' + _self.name + ']');
	});
};

/**
 * Locates the appropriate route for the provided uri_bundle, and provides it to the sucess callback.
 * If not found, the failure callback is called with no parameters
 * 
 * @param  {Object} uri_bundle 
 * @param {Function} success takes two parameters, the route, and the resource associated with the route
 * @param {Function} failure
 * @return {Objectt}
 */
Resource.prototype.processRoute = function (uri_bundle, success, failure) {
	var route = this.router.getRoute(uri_bundle, (typeof failure === "function"));
	var key = null;

	if (!route) {
		// attempt each child, see if you can find a proper route
		for (key in this.resources) {
			// we don't want to fail immediately, so we ignore the fail scenario here. fail should only be called on teh top most resource
			if (this.resources[key].processRoute(uri_bundle, success)) {
				return true;
			}
		}
	}

	if (!route) {
		route = this.router.getDefaultRoute(uri_bundle);
	}

	// todo: should these be called on next tick?
	if (route) {
		success(route, this);
		return true;
	}

	if (failure) {
		failure();
	}
	
	return false;
};
