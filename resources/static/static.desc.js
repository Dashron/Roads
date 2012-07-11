var fs_module = require('fs');

module.exports = {
	route_catch_all : /\.(js|css|txt|html|ico)$/,
	routes : [{ 
		match : /^\/(([\w.\/]+)\.(js|css|txt|html|ico))$/,
		options : {
			keys : ['file', 'name', 'ext'],
			ignore_template : true,
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
					view.statusNotFound('404.html');
				} else {
					view.error(function (error) {
						console.log(error);
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
	}],
	unmatched_route : {
		GET : function (uri_bundle, view) {
			view.statusNotFound('404.html');
		},
		options : {
			modes : ['text/html']
		}
	},
	dependencies : [
		'user'
	],
	models : [
	],
	config : {
	},
	view_renderers : require('./static.renderers')
};
