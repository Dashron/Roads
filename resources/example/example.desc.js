module.exports = {
	name : 'example',
	template : function (view) {
		view.set('title', 'hello world');
		view.render('template.html');
	},
	routes : [{ 
		match : /^\/$/,
		modes : ['text/html'],
		GET : function (uri_bundle, view) {
			var resource = this.getResource('user');
			resource.request('/users/1', view.child('user'));
			resource.request('/users/5', view.child('user_two'));
			view.render('index.html');
		},
		options : {
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
	}
};
