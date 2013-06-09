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

/**
 * [Resource description]
 * @param {[type]} resource [description]
 */
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
 * [resource_getResource description]
 * @param  {[type]} key [description]
 * @return {[type]}     [description]
 */
Resource.prototype.resource = function resource_getResource (key) {
	return module.exports.get(key);
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
 * Todo: route should use this method. Port all code directly related to showing a view into this method.
 * Include a  "template" parameter in the request.
 * 
 * @param  {[type]} request [description]
 * @param  {[type]} view    [description]
 * @return {[type]}         [description]
 */
Resource.prototype.request = function resource_request (route_info, view) {
	if (typeof route_info.method !== "string") {
		route_info.method = "GET";
	}

	if (!route_info.controller || !route_info.view) {
		throw new Error('controller and view are required');
	}

	var controller = this.controller(route_info.controller);
	var route = controller[route_info.view];
	view.dir = this.dir + '/templates/';
	
	// todo: add a way to configure this via the route_info
	view.content_type = 'text/html';

	if (typeof route === "object") {
		if (typeof route[route_info.method] === "undefined") {
			view.statusUnsupportedMethod(Object.keys(route));
			return true;
		} else {
			return route[route_info.method].call(this, route_info.request, view, route_info.next_request);
		}
	} else {
		// call request directly
		return route.call(this, route_info.request, view, route_info.next_request);
	}
};

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

	// If this is obviously a static file, route that way
	if (matches) {
		return this.routeStatic(request, view, matches);
	}

	// Find the first route matching the url pathname
	for (var i = 0; i < this.routes.length; i ++) {
		matches = request.url.pathname.match(this.routes[i].route);
		if (matches) {
			matched_route = this.routes[i];
			break;
		}
	}

	// if there is a match, do stuff
	if (matches && matched_route) {
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
		
		// Templates are executed first, and the route is passed along as a "next" parameter which can be executed.
		if (matched_route.template !== false) {
			if (typeof matched_route.template !== "string") {
				matched_route.template = "main";
			}

			var base_resource = module.exports.get(Config.get('web.base_resource'));
			var this_resource = this;

			base_resource.request({
				controller : 'template',
				view : matched_route.template,
				request : request,
				next_request : function (request, view) {
					// call the next request with the appropriate variables
					this_resource.request({
						controller : matched_route.controller,
						view : matched_route.view,
						request : request
					}, view);
				}
			}, view);
			return true;
		} else {
			// call the request without any future data
			this.request({
				controller : matched_route.controller,
				view : matched_route.view,
				request : request
			}, view);
			return true;
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