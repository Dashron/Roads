module.exports = {
	template : function (view) {
		view.set('title', 'hello world');
		view.render('template.html');
	},
	routes : require('./example.routes'),
	unmatched_route : {
		GET : function (uri_bundle, view) {
			console.log('unmatched route');
			console.log(uri_bundle);
			view.statusNotFound('404.html');
		},
		options : {
			modes : ['text/html']
		}
	},
	dependencies : [
		'user',
		'blog',
		'static'
	],
	models : [
	],
	config : {
		dbs : {
			"default" : {
				hostname: 'localhost',
				user : 'gfw',
				database: 'gfw'
			}
		}
	},
	view_renderers : require('./example.renderers')
};