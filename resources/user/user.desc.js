module.exports = {
	name : 'user',
	route_catch_all : /^\/users/,
	routes : [{
		match : /^\/users$/,
		modes : ['text/html'],
		GET : function (uri_bundle, view) {
			var users_promise = this.models['user'].getAll();
			users_promise.ready(function (users) {
				view.set('users', users);
				view.render('many.html');
			})
		},
		options : {

		}
	},{
		match : /^\/users\/(\d+)$/,
		modes : ['text/html'],
		GET : function (uri_bundle, view) {
			var user_promise = this.models['user'].load(uri_bundle.params.id);
			user_promise.ready(function (user) {
				view.set('user', user);	
				view.render('one.html');
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
