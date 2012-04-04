module.exports = {
	name : 'example',
	uri : '/',
	default_template : 'index.html',
	routes : [{ 
		match : /^$/,
		modes : ['text/html'],
		GET : function (uri_bundle, view) {
			var resource = this;
			resource.request('/user/1', view.child('user'));
			process.nextTick(function () {
				resource.request('/user/5', view.child('user_two'));
				view.render('index.html');
			});
			
		},
		options : {
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
