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
			
			view.set('cookie_old_value', uri_bundle.cookie.get('date'));
			var date = new Date().toString();
			
			if (uri_bundle.cookie.get('second_date')) {
				uri_bundle.cookie.delete('second_date');
			} else {
				uri_bundle.cookie.set('second_date', { value : date, domain : '127.0.0.1' });
			}

			uri_bundle.cookie.set('date', { value : date , domain : '127.0.0.1' });
			

			view.set('cookie_new_value', date);

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
	},
	view_renderers : require('./example.renderers')
};