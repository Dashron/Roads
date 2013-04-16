"use strict";

var Controller = require('./controller');
var routes = require('../web/routes');

module.exports.dynamic = function (request, view) {
	var matches = null;
	view.content_type = 'text/html';

	for (var i = 0; i < routes.length; i ++) {
		matches = request.url.pathname.match(routes[i].route);

		if (matches) {
			view.dir = view.dir + '/templates/';
			
			if (matches.length > 1 && typeof routes[i].keys === "object") {
				var extra_get_vals = {};

				// First element is always the matched selection, and not a group
				matches.shift();
				extra_get_vals = findUrlMatches(routes[i].keys, matches);

				for(var key in extra_get_vals) {
					request.url.query[key] = extra_get_vals[key];
				}
			}

			var controller = Controller.get(routes[i].controller);
			var route = controller[routes[i].view];

			if (request.url.query._method) {
				request.method = request.url.query._method;
				delete request.url._method;
			}
			
			if (typeof route === "object") {
				if (typeof route[request.method] == "undefined") {
					view.statusUnsupportedMethod(Object.keys(route));
					return true;
				} else {
					route = route[request.method];
				}
			}

			if (route) {
				if (routes[i].template !== false) {
					if (typeof routes[i].template != "string") {
						routes[i].template = "main";
					}

					Controller.get('template')[routes[i].template](request, view, route);
					return true;
				} else {
					route(request, view);
					return true;
				}
			} else {
				throw new Error('could not find controller: ' + routes[i].controller + ' and view :' + routes[i].view);
			}
		}
	}
	
	view.statusNotFound('404.html');
	return false;
};

"use strict";

module.exports.static = function (request, view) {
	var matches = request.url.match(/^\/(([\w.\/-]+)\.(js|css|txt|html|ico))$/);

	if (matches) {
		view.error(function (error) {
			console.log(error);
			view.dir = view.dir + '/templates/';
			view.statusNotFound('404.html');
		});

		if (matches[3] === 'js') {
			view.dir = view.dir + '/static/';
			view.content_type = "text/javascript";
			view.render(matches[1]);
		} else if (matches[3] === 'css') {
			view.dir = view.dir + '/static/';
			view.content_type = "text/css";
			view.render(matches[1]);
		} else {
			view.content_type = "text/html";
			view.dir = view.dir + '/templates/';
			view.statusNotFound('404.html');
		}
		return true;
	} else {
		return false;
	}
};



function findUrlMatches(keys, matches) {
	var GET = {};
	var i = 0;
	if (Array.isArray(keys)) {
		for (i = 0; i < matches.length; i++) {
			if (typeof keys[i] != "undefined") {
				GET[keys[i]] = matches[i];
			} else {
				throw new Error('Route match found without an appropriate key');
			}
		}
	}

	return GET;
}



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