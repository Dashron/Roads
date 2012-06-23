var fs_module = require('fs');

module.exports = {
	name : 'static',
	router_catch_all : /^\/static/,
	routes : [{ 
		match : /^\/static\/(([\w.\/]+)\.(js|css|txt|html))$/,
		modes : ['text/javascript', 'text/css', 'text/plain'],
		GET : function (uri_bundle, view) {
			var request_date = uri_bundle.headers['if-modified-since'];
			var path = view.dir + uri_bundle.params.file;
// For some reason, this view does not take the new render mode content-type
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
					view.error(err);
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
		},
		options : {
			keys : ['file', 'name', 'ext'],
			ignore_template : true
		}
	}],
	unmatched_route : {
		GET : function (uri_bundle, view) {
			console.log('unmatched route');
			console.log(uri_bundle);
			view.statusNotFound('404.html');
		},
	},
	dependencies : [
		'user'
	],
	models : [
	],
	config : {
	}
};
