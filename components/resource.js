/*
 * gfw.js - resource.js
 * Copyright(c) 2011 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 */

"use strict";

var url_module = require('url');
var http_module = require('http');

var accept_header_component = require('./accept_header');
var view_component = require('./view');
var View = view_component.View;
var Router = require('./router').RegexRouter;

var _resources = {};
var _resource_dir = __dirname.replace('components', 'resources/');

/**
 * Set the default directory  to load resources from
 * 
 * @param {String} directory 
 */
var set_resource_dir = exports.setResourceDir = function (directory) {
	if (directory.charAt(directory.length) != '/') {
		directory = directory + '/';
	}
	
	_resource_dir = directory;
};

/**
 * Build a single resource by name, and cache it
 * 
 * @param {String} name
 * @param {Object} config
 * @return {Resource}
 */
var get_resource = exports.get = function (name, config) {
	if (typeof _resources[name] == "undefined" || _resources[name] == null) {
		console.log("Loading Resource:" + name);
		_resources[name] = new Resource(name, require(_resource_dir + name + '/' + name + '.desc.js'));
	}

	return _resources[name];
};

/**
 * Free up the memory of all resources built within this module
 */
var clear = exports.clear = function () {
	_resources = {};
};

/**
 * Constructs a resource
 * 
 * @todo : document all the description properties
 * @param {Object} description
 */
var Resource = exports.Resource = function Resource (name, description) {
	this.name = name;
	this.router = new Router(description.route_catch_all);
	this.directory = __dirname.replace("components", '') + 'resources/' + this.name;
	this.template_dir = this.directory + '/templates/';
	this.config = description.config;
	this.template = description.template;
	this.resources = {};
	this.db = null;

	var i = 0, j = 0;
	var key = null;
	var route = null;

	for (i = 0; i < description.routes.length; i++) {
		route = description.routes[i];
		if (typeof route.options != "object") {
			route.options = {};
		}
		if (typeof route.modes === "undefined") {
			route.modes = ['text/html'];
		}
		this.router.addRoute(route.match, route, route.options.keys);
	}

	if (typeof description.unmatched_route === "object") {
		this.router.unmatched_route = description.unmatched_route;
	}

	if (Array.isArray(description.dependencies)) {
		for (i = 0; i < description.dependencies.length; i++) {
			this.resources[this.name] = get_resource(description.dependencies[i]);
		}
	}

	this.models = {};
	for (key in description.models) {
		console.log('adding model: ' + key);
		this.models[key] = description.models[key];
	}

	for (key in description.view_renderers) {
		console.log('adding renderer: ' + key);
		view_component.addRenderer(key, description.view_renderers[key]);
	}
};

Resource.prototype.name = '';
Resource.prototype.config = null;
Resource.prototype.directory = '';
Resource.prototype.template_dir = '';
Resource.prototype.template = null;
Resource.prototype.router = null;
Resource.prototype.resources = null;
Resource.prototype.models = {};
Resource.prototype.db = null;

/**
 * Retrieves a resource by.
 * This is not just child resources, this is any resource you have a description for
 * 
 * @param  {String} name
 * @return {Resource}
 */
Resource.prototype.getResource = function (name) {
	return get_resource(name);
};

/**

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
			
			if (typeof route.options.modes === "undefined" || route.options.modes === null) {
				throw new Error('no route modes found for ' + uri_bundle.uri);
			}

			view.setContentType(accept_header_component.getContentType(uri_bundle.headers.accept, route.options.modes));
			view.setResponse(response);
		}

		// If a template is set in the config, apply it to the current view and then provide a child view to the route
		if (!route.options.ignore_template && typeof _self.template === "function") {
			// We don't want to set the route resources directory, we will always create the template from the resource upon which request is called
			view.dir = _self.template_dir;
			var child = view.child('content');
			_self.template(view);
			view = child;
		}

		// assume that we want to load templates directly from this route, no matter the data provided
		view.dir = route_resource.template_dir;

		// route, allowing this to point to the original resource, and provide some helper utils
		if (typeof route[uri_bundle.method] == "function") {
			// Route to the proper method
			process.nextTick(function() {
				route[uri_bundle.method].call(route_resource, uri_bundle, view);
			});
		} else if (typeof route['default'] === "function") {
			// Allow default routes in case the method is not explicitly stated
			process.nextTick(function() {
				route.default.call(route_resource, uri_bundle, view);
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
	var route = this.router.getRoute(uri_bundle);
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
		route = this.router.getUnmatchedRoute(uri_bundle);
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


/**
 * Iterates through all dependent resources and applies a datbase connection if not pre-configured for one
 * 
 * @param  {Array} children   [description]
 * @param  {[type]} connection [description]
 */
var populate_child_connections = function (children, connection) {
	var key = null;
	for (key in children) {
		if (typeof children[key].db === "undefined" || children[key].db === null) {
			children[key].db = connection;
			// we want to fill all empty children with the provided default connection
			// this might not  be the right path
			populate_child_connections(children[key].children, connection);
		}
	}
};
