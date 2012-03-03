/*
 * gfw.js - resource.js
 * Copyright(c) 2011 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 */

"use strict";
var fs_module = require('fs');
var url_module = require('url');
var mongoose_module = require('mongoose');
var http_module = require('http');
// todo replace this with a chunked renderer like mu?
var hogan_module = require('hogan.js');

var static_component = require('./static');
var request_component = require('./request_wrapper');
var response_component = require('./response_wrapper');
var View = require('./view').View;
var Firebug = require('./firenode/firenode').Firebug;
var Cookie = require('./cookie').Cookie;
var Router = require('./router').RegexRouter;

var _resources = {};

/**
 * Build a single resource by name, and cache it
 * 
 * @param {String}
 *            name
 * @param {Object}
 *            config
 * @return {Resource}
 */
var get_resource = exports.get = function (name, config) {
	if (typeof _resources[name] == "undefined" || _resources[name] == null) {
		console.log("Loading Resource:" + name);
		_resources[name] = build(name, require(__dirname.replace('components', 'resources/') 
			+ name + '/' + name + '.desc.js'));
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
 * [build description]
 * @param  {[type]} description [description]
 * @return {[type]}
 */
var build = exports.build = function (name, description) {
	var i = 0;
	var key = null;
	var route = null;
	var resource = new Resource(name);

	resource.uri = description.uri;
	resource.directory = __dirname.replace("components", '') + 'resources/' + name;
	resource.template_dir = resource.directory + '/templates/';
	resource.default_template = description.default_template;

	resource.router.unmatched_route = description.unmatched_route;
	resource.config = description.config;

	for (i = 0; i < description.routes.length; i++) {
		route = description.routes[i];
		resource.addRoute(route.match, route.fn, route.options);
	}

	for (i = 0; i < description.dependencies.length; i++) {
		resource.addChild(get_resource(description.dependencies[i]));
	}


	if (typeof resource.config.db === "object" && typeof resource.config.db.connection === "string") {
		resource.db = mongoose_module.createConnection(resource.config.db.connection);
		populate_child_connections(resource.children, resource.db);
	}

	for (key in description.models) {
		resource.addModel(key, description.models[key]);
	}

	return resource;
};

/**
 * [populate_child_connections description]
 * @param  {[type]} children   [description]
 * @param  {[type]} connection [description]
 * @return {[type]}
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
 * [Resource description]
 * @param {[type]} name [description]
 */
var Resource = exports.Resource = function Resource (name) {
	this.name = name;
	this.config = {};
	this.router = new Router();
	this.models = {};
	this.resources = {};
	this.db = null;
	this.unmatched_route = null;
	this.templates = {};
};

Resource.prototype.name = '';
Resource.prototype.uri = '';
Resource.prototype.directory = '';
Resource.prototype.config = null;
Resource.prototype.router = null;
Resource.prototype.models = {};
Resource.prototype.resources = null;
Resource.prototype.db = null;
Resource.prototype.templates = null;
Resource.prototype.template_dir = '';
Resource.prototype.default_template = null;

/**
 * [addRoute description]
 * @param {[type]}   match [description]
 * @param {Function} fn    [description]
 */
Resource.prototype.addRoute = function (match, fn, options) {
	this.router.add(match, fn, options);
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
	this.models[key] = model;
}

/**
 * [route description]
 * @param  {[type]} uri_bundle [description]
 * @param  {[type]} view       [description]
 * @return {[type]}
 */
Resource.prototype.request = function (uri_bundle, view) {
	var route = this.getRoute(uri_bundle);
	
	if (view instanceof http_module.ServerResponse) {
		view = (new View(this.default_template)).setResponse(view);
	}

	// assume that we want to load templates directly from this route, no matter the data provided
	view.setDir(this.template_dir);

	// route, allowing this to point to the original resource, and provide some helper utils
	route.call(this, uri_bundle, view);
};

/**
 * [getRoute description]
 * @param  {[type]} uri_bundle [description]
 * @return {[type]}
 */
Resource.prototype.getRoute = function (uri_bundle) {
	// what to do here? how do I route down into the children?
	// We don't have to pass the view, we can assume it's correct.
	// we just need to make sure that the promise returned is bound to the right resource
	var route = this.router.getRoute(uri_bundle);

	if (route) {
		return route;
	} else {
		// attempt each child, see if you can find a proper route
		for (key in this.resources) {
			route = this.resources[key].getRoute(uri_bundle);

			if (route) {
				return route;
			}
		}
	}

	// No route was found
	return false;
};

/**
 * Retrieve the proper route for the provided request.
 * This function also binds the resource as the "this" value for each route
 * 
 * @param  {[type]} request [description]
 * @param  {[type]} ready   [description]
 * @return {[type]}
 */
/*Resource.prototype.getRoute = function (request, ready) {
	var _self = this;
	var modified_ready = function (route) {
		route.bind(_self);
		ready(route);
	};

	if (_self.router.getRoute(request, modified_ready)
		return true;
	} else {
		for (var i in _self.resources) {
			if(_self.resources[i].getRoute(request, ready)) {
				return true;
			}
		}
	}

	if (typeof _self.unmatched_route === "function") {
		// router routes are always on next tick, so we need to match that functionality
		process.nextTick(function () {
			_self.unmatched_route.bind(_self);
			ready(_self.unmatched_route);
		})
		return true;
	}

	return false;
};*/

/**
 * [buildView description]
 * @param  {Function} callback [description]
 * @return {[type]}
 */
/*Resource.prototype.buildView = function (name, success, error) {
	if (typeof name != "string") {
		// return new View(_self.defaultTemplate);
		name = _self.defaultTemplate;
	} else {
		// return _self.buildView().child(name);
	}

	static_component.loadFile(_self.template_dir + name, function (contents) {
		// use old mu system, so that render() triggers up a chain.
		success(hogan_module.compile(contents));
	}, error);
};*/

/**
 * 
 * @param router
 * @returns
 * @todo allow users to configure their resource to not take default template or
 *       js or css routes
 */
var applyTemplateRoutes = function (router, resource) {
	router.add(new RegExp('^/' + resource.name + '/template/(.+)$'), function (request, response, callback) {
		static_component.streamFile(resource.template_dir + request.GET['template'], response, {
			request : request,
			callback : callback
		});
	}, {keys : ['template']});

	router.add(new RegExp('^/' + resource.name + '/template/(.+)$'), function (request, response, callback) {
		static_component.loadFile(resource.template_dir + request.GET['template'], function (contents) {
			// todo replace this with a chunked renderer like mu?
			var template = hogan_module.compile(contents);
			response.ok(template.render(request.POST));
			callback();

		}, function (error) {
			response.error(error);
			callback();
		});
	}, {method : "POST", keys : ['template']});

	router.add(new RegExp('^/' + resource.name + '(\/.+\.js)$'), function (request, response, callback) {
		var filename = request.GET['file'].replace(/\.\./, '');
		static_component.streamFile(resource.directory + '/templates/js' + filename, response, {
			request : request,
			callback : callback
		});
	}, {keys : ['file']});

	router.add(new RegExp('^/' + resource.name + '(\/.+\.css)$'), function (request, response, callback) {
		var filename = request.GET['file'].replace(/\.\./, '');
		static_component.streamFile(resource.directory + '/templates/css' + filename, response, {
			request : request,
			callback : callback
		});
	}, {keys : ['file']});
};

var applyResourceRoutes = function (router, resource) {
	router.add(new RegExp('^/' + resource.name + '/(\d+)$'), function (request, response, callback) {
		resource.models[resource.name].get({id : request.GET['id']});
	}, {method : "GET", keys : ['id']});

	router.add(new RegExp('^/' + resource.name + '/$'), function (request, response, callback) {
		resource.models[resource.name].get({id : request.GET['id']});
	}, {method : "POST", keys : ['id']});

	router.add(new RegExp('^/' + resource.name + '/(\d+)$'), function (request, response, callback) {
		resource.models[resource.name].save({id : request.GET['id']});
	}, {method : "PUT", keys : ['id']});

	router.add(new RegExp('^/' + resource.name + '/(\d+)$'), function (request, response, callback) {
		resource.models[resource.name].delete({id : request.GET['id']});
	}, {method : "DELETE", keys : ['id']});
};