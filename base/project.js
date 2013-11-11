"use strict";

/**
* project.js
* Copyright(c) 2012 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

var Config = require('./config');

var projects = {};

module.exports.root_dir = __dirname + '/../projects/';

/**
 * [get description]
 * @param  {[type]} path [description]
 * @return {[type]}      [description]
 */
module.exports.get = function getProject (label) {
	if (typeof projects[label] === "undefined") {
		var dir = module.exports.root_dir + label;

		projects[label] = require(dir + '/project');
		projects[label].dir = dir;
	}

	return projects[label];
};

/**
 * [ description]
 * @param  {[type]} route [description]
 * @return {[type]}       [description]
 */
var apply_route_inheritance = function (route) {
	var controller = route.controller;
	var template = route.template;

	var view = null;
	var sub_route = null;

	if (!route.routes) {
		return;
	}

	for (var key in route.routes) {
		sub_route = route.routes[key];

		if (typeof sub_route === "string") {
			view = sub_route;

			route.routes[key] = {
				view : view
			}
		}

		if (typeof sub_route.controller === "undefined") {
			route.routes[key].controller = controller;
		}

		if (typeof sub_route.template == "undefined" && typeof template != "undefined") {
			route.routes[key].template = template;
		}

		apply_route_inheritance(route.routes[key]);
	}
};

/**
 * [Project description]
 * @param {[type]} definition [description]
 */
var Project = module.exports.Project = function Project (definition) {
	var key = null;

	this.controllers = {};
	this.models = {};
	this.routes = {};

	for (key in definition.controllers) {
		this.controllers[key] = definition.controllers[key];
	}

	for (key in definition.models) {
		this.models[key] = definition.models[key];
	}

	this.routes = definition.routes;

	var route = null;

	for (key in this.routes) {
		route = this.routes[key];

		if ((!route.controller || !route.view) && !route.uri) {
			throw new Error('you must supply a controller and view, or uri for each route');
		}

		apply_route_inheritance(route);
	}
};

/**
 * [controllers description]
 * @type {[type]}
 */
Project.prototype.controllers = null;

/**
 * [routes description]
 * @type {[type]}
 */
Project.prototype.routes = null;

/**
 * [models description]
 * @type {[type]}
 */
Project.prototype.models = null;

/**
 * [dir description]
 * @type {[type]}
 */
Project.prototype.dir = null;

/**
 * [model description]
 * @param  {[type]} key [description]
 * @return {[type]}     [description]
 */
Project.prototype.model = function project_model (key) {
	if (!this.models && this === {}) {
		throw new Error('You have improperly tried to create a project. Please wrap the model module in parens, separate of the "Model()" portion.');
	}
	return this.models[key];
};

/**
 * [project_getProject description]
 * @param  {[type]} key [description]
 * @return {[type]}     [description]
 */
Project.prototype.project = function project_getProject (key) {
	return module.exports.get(key);
};

/**
 * [getController description]
 * @param  {[type]} key [description]
 * @return {[type]}     [description]
 */
Project.prototype.controller = function project_controller (key) {
	var controller = this.controllers[key];
	
	if (controller === null || typeof controller === "undefined") {
		throw new Error('Roads could not find the controller "' + key + '"');
	}

	return controller;
};


/**
 * This should take the route information and execute the appropriate controller/view method
 * 
 * @param  {[type]} request [description]
 * @param  {[type]} view    [description]
 * @return {[type]}         [description]
 */
Project.prototype.render = function project_request (route_info, request, view, next) {
	if (!route_info) {
		throw new Error('you must provide route info to the render method');
	}

	if (route_info.uri) {
		throw new Error("request uri's are not yet supported");
	} else {
		if (route_info.template) {
			var main_project = module.exports.get(route_info.template.project);
			var this_project = this;

			return main_project.render({
				controller : route_info.template.controller,
				view : route_info.template.view
			}, request, view, function next_request (request, view) {
				// call the next request with the appropriate variables
				return this_project.render({
					controller : route_info.controller,
					view : route_info.view
				}, request, view, next);
			});

		} else {
			// this is a major hack. make this better
			view.dir = (view.content_type == 'application/json') ? this.dir + '/api/' : this.dir + '/templates/';
			
			var method = route_info.method || request.method;

			// allow postbody overrides of the http method so that we can structure our http methods
			if (method === "POST" && request.body._method) {
				method = request.body._method;
			}

			var route = this.controller(route_info.controller)[route_info.view];
			if (typeof route === "object") {
				if (typeof route[method] === "undefined") {
					view.statusUnsupportedMethod(Object.keys(route));
					return true;
				} else {
					return route[method].call(this, request, view, next);
				}
			} else if (route) {
				// call request directly
				return route.call(this, request, view, next);
			} else {
				return view.statusError(new Error('invalid route called through render: c=' + route_info.controller + ' v=' + route_info.view));
			}
		}
	}
};

/**
 * Find the proper route for the provided request object
 * 
 * @param  {[type]}   request
 * @param  {[type]}   view
 * @param  {Function} next
 * @return {[type]}
 */
Project.prototype.route = function project_route (request, view, next) {
	var matches = request.url.pathname.match(/^\/(([\w.\/-]+)\.(js|css|txt|html|ico))$/);
	var matched_route = null;

	// If this is obviously a static file, route that way
	if (matches) {
		return this.routeStatic(request, view, matches);
	}

	var routes = this.routes;
	var route = null;

	if (request.url.pathname === '/') {
		route = this._partMatches(routes, '/', request);
	} else {
		// this will cause issues
		var parts = request.url.pathname.split('/');
		// if the uri starts wiht a forward slash, we will have an empty string at the start of the array
		var part = parts.shift();

		// loop through every part separated by slashes and incrementally check them against the routes
		while (parts.length) {
			part = parts.shift()
			route = this._partMatches(routes, part, request);

			// if we found a matching route
			if (!route) {
				break;
			}

			// if we need to dig deeper
			if (route.routes && parts.length) {
				routes = route.routes;
			}
		}
	}

	if (!route) {
		console.log('route not found');
		// we have a url part which does not properly match a route, so 404
		view.content_type = 'text/html';
		return view.statusNotFound(module.exports.get(Config.get('web.projects./')).dir + '/templates/' + Config.get('web.templates.404'));
	}

	// render the located route
	return this.render(route, request, view, next);
}

/**
 * See if a url part matches any of the provided routes.
 * This does not recurse deeper into the sub routes, that is handled elsewhere
 * 
 * @param  {[type]} routes
 * @param  {[type]} request_url
 * @param  {[type]} request
 * @return {[type]}
 */
Project.prototype._partMatches = function project__partMatches (routes, request_url, request) {
	// block urls that contain double forward slashes (localhost/maps//tiles)
	if (!request_url.length) {
		return false;
	}

	for (var url_part in routes) {
		if (request_url === url_part) {
			return routes[url_part];
		}

		if (url_part[0] === '#') {
			if (!isNaN(Number(request_url))) {
				request.url.query[url_part.substring(1)] = request_url;
				return routes[url_part];
			}
			continue;
		}

		if (url_part[0] === '$') {
			request.url.query[url_part.substring(1)] = request_url;
			return routes[url_part];
		}
	}

	return false;
};

/**
 * [route description]
 * @param  {[type]}   request
 * @param  {[type]}   view
 * @param  {Function} next
 * @return {[type]}
 */
/*Project.prototype.route = function project_route (request, view, next) {
	var matches = request.url.pathname.match(/^\/(([\w.\/-]+)\.(js|css|txt|html|ico))$/);
	var matched_route = null;

	// If this is obviously a static file, route that way
	if (matches) {
		return this.routeStatic(request, view, matches);
	}

	// Find the first route matching the url pathname
	for (var pattern in this.routes) {
		console.log('testing pattern ' + pattern);
		matches = request.url.pathname.match(new RegExp(pattern));
		if (matches) {
			matched_route = this.routes[pattern];
			break;
		}
	}

	// if there is a match, do stuff
	if (matches && matched_route) {
		
		// Templates are executed first, and the route is passed along as a "next" parameter which can be executed.
		// todo: custom templates won't work at the moment so we need to find a way to support it
		/*if (matched_route.template !== false) {
			if (typeof matched_route.template !== "string") {
				matched_route.template = "main";
			}

			var base_project = module.exports.get(Config.get('web.base_project'));
			var this_project = this;

			base_project.request({
				controller : 'template',
				view : matched_route.template,
				request : request,
				next_request : function (request, view) {
					// call the next request with the appropriate variables
					this_project.request({
						controller : matched_route.controller,
						view : matched_route.view,
						request : request
					}, view);
				}
			}, view);
			return true;
		} else {*/
			// call the request without any future data
			/*this.render({
				route : matched_route,
				request : request
			}, view);
			return true;
		//}
	}
	
	view.content_type = 'text/html';
	view.statusNotFound(module.exports.get(Config.get('web.base_project')).dir + '/templates/' + Config.get('web.templates.404'));
	return false;
};*/

Project.prototype.routeStatic = function (request, view, matches) {
	if (matches) {
		var dir = this.dir;
		view.dir = dir + '/static';

		view.error(function (error) {
			console.log(error);
			//view.dir = dir + '/templates/';
			view.statusNotFound(/*'404.html'*/);
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
var Project = require('../../components/project').Project;

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
						view.dir = new Project('example').template_dir;
						view.statusNotFound('404.html');
					} else {
						view.error(function (error) {
							console.log(error);
							view.dir = new Project('example').template_dir;
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
