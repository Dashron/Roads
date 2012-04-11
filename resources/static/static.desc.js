var fs_module = require('fs');

module.exports = {
	name : 'static',
	uri : '/static/',
	routes : [{ 
		match : /^([\w.\/]+)$/,
		modes : ['text/html'],
		GET : function (uri_bundle, view) {
			var request_date = uri_bundle.headers['if-modified-since'];
			var path = this.template_dir + uri_bundle.params.file;

			// can we improve this further? it would be nice to not need to stat a file each request
			if (typeof request_date === "string") {
				request_date = new Date(request_date);
				fs_module.stat(path, function (err, stats) {
					if (err) {
						view.error(err);
					} else {
						if (stats.mtime.getTime() > request_date.getTime()) {
							view.notModified();
						} else {
							view.render(uri_bundle.params.file);
						}
					}
				});
			} else {
				view.setErrorHandler(function (error) {
					view.notFound('404.html');
				});
				view.render(uri_bundle.params.file);
			}
		},
		options : {
			keys : ['file']
		}
	}],
	unmatched_route : {
		GET : function (uri_bundle, view) {
			console.log('unmatched route');
			console.log(uri_bundle);
			view.notFound('404.html');
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
