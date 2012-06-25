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
var set_resource_dir = exports.setDir = function (directory) {
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
		_resources[name] = build(name, require(_resource_dir + name + '/' + name + '.desc.js'));
	}

	return _resources[name];
};

/**
 * Removes a single resource from the cache list
 * 
 * @param  {[type]} name [description]
 * @return {[type]}
 */
var remove_resource = exports.remove = function (name) {
	_resources[name] = null;
};

/**
 * Free up the memory of all resources built within this module
 */
var clear = exports.clear = function () {
	_resources = {};
};

/**
 * Builds a resource with the provided resource description.
 * 
 * The description contains.....
 * 
 * directory : 
 * template_dir : 
 * template : 
 * route_catch_all : 
 * unmatched_route : 
 * routes : 
 * config : 
 * dependencies : 
 * models : 
 * 
 * @param {string} name
 * @param  {Object} description
 * @return {Resource}
 */
var build = exports.build = function (name, description) {
	var i = 0, j = 0;
	var key = null;
	var route = null;
	var resource = new Resource(name);

	resource.directory = __dirname.replace("components", '') + 'resources/' + name;
	resource.template_dir = resource.directory + '/templates/';
	resource.template = description.template;

	resource.router = new Router(description.route_catch_all);
	resource.router.unmatched_route = description.unmatched_route;
	resource.config = description.config;

	for (i = 0; i < description.routes.length; i++) {
		route = description.routes[i];
		if (typeof route.options != "object") {
			route.options = {};
		}
		resource.addRoute(route.match, route, route.options.keys);
	}

	for (i = 0; i < description.dependencies.length; i++) {
		resource.addChild(get_resource(description.dependencies[i]));
	}

	for (key in description.models) {
		console.log(key);
		resource.addModel(key, description.models[key]);
	}

	return resource;
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

/**
 * Constructs a resource
 * 
 * @param {string} name
 */
var Resource = exports.Resource = function Resource (name) {
	this.name = name;
	this.config = {};
	this.router = null;
	this.models = {};
	this.resources = {};
	this.db = null;
	this.unmatched_route = null;
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
 * [getResource description]
 * @param  {[type]} name [description]
 * @return {[type]}      [description]
 */
Resource.prototype.getResource = function (name) {
	return get_resource(name);
};

/**
 * [addRoutes description]
 * @param {[type]} match   [description]
 * @param {Object} routes  Mapping of Method => Function
 * @param {[type]} options [description]
 */
Resource.prototype.addRoute = function (match, route, keys) {
	this.router.addRoute(match, route, keys);
};

/**
 * [addChild description]
 * @param {[type]} resource [description]
 */
Resource.prototype.addChild = function (resource) {
	this.resources[resource.name] = resource;
}

/**
 * [addModel description]
 * @param {[type]} key   [description]
 * @param {[type]} model [description]
 */
Resource.prototype.addModel = function (key, model) {
	console.log('adding model');
	this.models[key] = model;
}

/**
 * [route description]
 * @param  {[type]} uri_bundle [description]
 * @param  {[type]} view       [description]
 * @return {[type]}
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
			view.setContentType(accept_header_component.getContentType(uri_bundle.headers.accept, route.modes));
			// todo: not sure this will actually be desired due to view template precedence.
			//view.setTemplate(this.default_template);
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
		throw new Error('route not found :' + uri_bundle.uri + ' [' + _self.name + ']');
	});
};

/**
 * [getRoute description]
 * @todo  return a promise
 * @param  {[type]} uri_bundle [description]
 * @return {[type]}
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

	if (this.unmatched_route) {
		route = this.unmatched_route;
	}

	if (route) {
		success(route, this);
		return true;
	}

	if (failure) {
		failure();
	}
	
	return false;
};