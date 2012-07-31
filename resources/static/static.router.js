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