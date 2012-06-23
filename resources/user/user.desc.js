

module.exports = {
	name : 'users',
	route_catch_all : /^\/users/,
	routes : [{
		match : /^\/users\/(\d+)$/,
		GET : function (uri_bundle, view) {
			var user_promise = this.models['user'].load(uri_bundle.params.id);
			user_promise.ready(function (user) {
				view.set('user', user);	
				view.render('user.html');
			});

			user_promise.error(function (error) {
				view.statusError(error);
				console.log(error);
			});
		},
		options : {
			keys : ['id']
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
	],
	models : {
		'user' : require('./models/user.model')
	},
	config : {
	}
};
