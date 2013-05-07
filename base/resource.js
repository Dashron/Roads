"use strict";

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
	var matches = null;
	//view.content_type = 'text/html';

	for (var i = 0; i < this.routes.length; i ++) {
		matches = request.url.pathname.match(this.routes[i].route);

		if (matches) {
			view.dir = this.dir + '/templates/';
			
			// if the route regex contained groups, assign the groups as getvals relative to the "keys" parameters
			if (matches.length > 1 && typeof this.routes[i].keys === "object") {
				var extra_get_vals = {};

				// First element is always the matched selection, and not a group
				matches.shift();
				extra_get_vals = findUrlMatches(this.routes[i].keys, matches);

				for(var key in extra_get_vals) {
					request.url.query[key] = extra_get_vals[key];
				}
			}

			var controller = this.controller(this.routes[i].controller);
			var route = controller[this.routes[i].view];

			// allow the method to be overriden by the value sent as _method via POST
			if (request.POST._method) {
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
				// Templates are executed first, and the route is passed along as a "next" parameter which can be executed.
				// All routes have the resource as "this"
				if (this.routes[i].template !== false) {
					if (typeof this.routes[i].template !== "string") {
						this.routes[i].template = "main";
					}

					this.controller('template')[this.routes[i].template].call(this, request, view, route.bind(this));
					return true;
				} else {
					route.call(this, request, view);
					return true;
				}
			} else {
				throw new Error('could not find controller: ' + this.routes[i].controller + ' and view :' + this.routes[i].view);
			}
		}
	}
	
	view.statusNotFound('404.html');
	return false;
};

Resource.prototype.routeStatic = function (request, view) {
	/*var matches = request.url.match(/^\/(([\w.\/-]+)\.(js|css|txt|html|ico))$/);

	if (matches) {
		view.error(function (error) {
			console.log(error);
			view.dir = view.dir + '/templates/';
			view.statusNotFound('404.html');
		});

		if (matches[3] === 'js') {
			view.dir = view.dir + '/js/';
			view.content_type = "text/javascript";
			view.render(matches[1]);
		} else if (matches[3] === 'css') {
			view.dir = view.dir + '/css/';
			view.content_type = "text/css";
			view.render(matches[1]);
		} else {
			view.content_type = "text/html";
			view.dir = view.dir;
			view.statusNotFound('404.html');
		}
		return true;
	} else {
		return false;
	}*/
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