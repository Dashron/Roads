"use strict";

/**
* resource.js
* Copyright(c) 2012 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

var Config = require('./config');

var resources = {};

module.exports.root_dir = __dirname + '/../resources/';

/**
 * [get description]
 * @param  {[type]} path [description]
 * @return {[type]}      [description]
 */
module.exports.get = function getResource (label) {
	if (typeof resources[label] === "undefined") {
		var dir = module.exports.root_dir + label;

		resources[label] = require(dir + '/resource');
		resources[label].dir = dir;
	}

	return resources[label];
};

var Resource = module.exports.Resource = function Resource (resource) {
	var key = null;

	this.controllers = {};
	this.models = {};
	this.routes = {};

	for (key in resource.controllers) {
		this.controllers[key] = require(resource.controllers[key]);
	}

	for (key in resource.models) {
		this.models[key] = require(resource.models[key]);
	}

	this.routes = require(resource.routes);
};

/**
 * [controllers description]
 * @type {[type]}
 */
Resource.prototype.controllers = null;

/**
 * [routes description]
 * @type {[type]}
 */
Resource.prototype.routes = null;

/**
 * [models description]
 * @type {[type]}
 */
Resource.prototype.models = null;

/**
 * [dir description]
 * @type {[type]}
 */
Resource.prototype.dir = null;

/**
 * [model description]
 * @param  {[type]} key [description]
 * @return {[type]}     [description]
 */
Resource.prototype.model = function resource_model (key) {
	return this.models[key];
};

/**
 * [getController description]
 * @param  {[type]} key [description]
 * @return {[type]}     [description]
 */
Resource.prototype.controller = function resource_controller (key) {
	return this.controllers[key];
};


function findUrlMatches(keys, matches) {
	var GET = {};
	var i = 0;
	if (Array.isArray(keys)) {
		for (i = 0; i < matches.length; i++) {
			if (typeof keys[i] !== "undefined") {
				GET[keys[i]] = matches[i];
			} else {
				throw new Error('Route match found without an appropriate key');
			}
		}
	}

	return GET;
}

/**
 * [route description]
 * @param  {[type]}   request
 * @param  {[type]}   view
 * @param  {Function} next
 * @return {[type]}
 */
Resource.prototype.route = function resource_route (request, view, next) {
	var matches = request.url.pathname.match(/^\/(([\w.\/-]+)\.(js|css|txt|html|ico))$/);
	var matched_route = null;

	if (matches) {
		return this.routeStatic(request, view, matches);
	}

	for (var i = 0; i < this.routes.length; i ++) {
		matches = request.url.pathname.match(this.routes[i].route);
		if (matches) {
			matched_route = this.routes[i];
			break;
		}
	}

	if (matches) {
		// if the route regex contained groups, assign the groups as getvals relative to the "keys" parameters
		if (matches.length > 1 && typeof matched_route.keys === "object") {
			var extra_get_vals = {};

			// First element is always the matched selection, and not a group
			matches.shift();
			extra_get_vals = findUrlMatches(matched_route.keys, matches);

			for(var key in extra_get_vals) {
				request.url.query[key] = extra_get_vals[key];
			}
		}

		var controller = this.controller(this.routes[i].controller);
		var route = controller[matched_route.view];

		// allow the method to be overriden by the value sent as _method via POST
		if (request.method !== "GET" && typeof request.POST === "object" && typeof request.POST._method === "string") {
			request.method = request.url.query._method;
			delete request.url._method;
		}
		
		// if the route isn't a direct route, but contains a hash of METHOD => ROUTE pairs, find the proper route
		if (typeof route === "object") {
			if (typeof route[request.method] === "undefined") {
				view.statusUnsupportedMethod(Object.keys(route));
				return true;
			} else {
				route = route[request.method];
			}
		}

		// if after all this hubub we have found a route, execute it
		if (route) {
			// todo: add a way to configure this via the route
			view.content_type = 'text/html';

			// Templates are executed first, and the route is passed along as a "next" parameter which can be executed.
			// All routes have the resource as "this"
			if (matched_route.template !== false) {
				if (typeof matched_route.template !== "string") {
					matched_route.template = "main";
				}

				var base_resource = module.exports.get(Config.get('web.base_resource'));
				var this_resource = this;

				// Update the template directory to be the base dir's template directory
				view.dir = base_resource.dir + '/templates/';

				base_resource.controller('template')[matched_route.template].call(base_resource, request, view, function (request, view) {
					// update the child view's template dir to be the appropriate resources template dir
					view.dir = this_resource.dir + '/templates/';
					route.call(this_resource, request, view);
				});
				return true;
			} else {
				view.dir = this.dir + '/templates/';
				route.call(this, request, view);
				return true;
			}
		} else {
			throw new Error('could not find controller: ' + matched_route.controller + ' and view :' + matched_route.view);
		}
	}
	
	view.content_type = 'text/html';
	view.statusNotFound(module.exports.get(Config.get('web.base_resource')).dir + '/templates/' + Config.get('web.templates.404'));
	return false;
};

Resource.prototype.routeStatic = function (request, view, matches) {
	if (matches) {
		var dir = this.dir;
		view.dir = dir + '/static';

		view.error(function (error) {
			console.log(error);
			//view.dir = dir + '/templates/';
			view.statusNotFound(/*'404.html'*/);
		});

		if (matches[3] === 'js') {
			view.dir = dir + '/js/';
			view.content_type = "text/javascript";
			view.render(matches[1]);
		} else if (matches[3] === 'css') {
			view.dir = dir + '/css/';
			view.content_type = "text/css";
			view.render(matches[1]);
		} else {
			view.content_type = "text/html";
			//view.dir = dir;
			view.statusNotFound(/*'404.html'*/);
		}
		return true;
	} else {
		return false;
	}
};


/*
var fs_module = require('fs');
var Router = require('../../components/router').RegexRouter;
var Resource = require('../../components/resource').Resource;

module.exports = new Router({
	catch_all : /\.(js|css|txt|html|ico)$/,
	routes : {
		public : [{ 
			match : /^\/(([\w.\/]+)\.(js|css|txt|html|ico))$/,
			keys : ['file', 'name', 'ext'],
			options : {
				modes : ['text/javascript', 'text/css', 'text/plain'],
			},
			GET : function (uri_bundle, view) {
				var request_date = uri_bundle.headers['if-modified-since'];
				var path = view.dir + uri_bundle.params.file;

				switch (uri_bundle.params.ext) {
					case 'js':
						view.setContentType('text/javascript');
						break;

					case 'css':
						view.setContentType('text/css');
						break;

					case 'txt':
					case 'html':
					default:
						view.setContentType('text/plain');
						break;
				}

				// can we improve this further? it would be nice to not need to stat a file each request
				fs_module.stat(path, function (err, stats) {				
					if (err) {
						console.log(err);
						view.dir = new Resource('example').template_dir;
						view.statusNotFound('404.html');
					} else {
						view.error(function (error) {
							console.log(error);
							view.dir = new Resource('example').template_dir;
							view.statusNotFound('404.html');
						});

						view.setHeader({
							'Last-Modified' : stats.mtime.toUTCString()
						});

						if (typeof request_date === "string") {
							request_date = new Date(request_date);

							if (stats.mtime.getTime() <= request_date.getTime()) {
								return view.statusNotModified();
							}
						}

						view.setTemplate(uri_bundle.params.file);
						view.render();
					}
				});
			}
		}]
	}
});
 */