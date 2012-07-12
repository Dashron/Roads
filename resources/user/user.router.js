var Router = require('../../components/router').RegexRouter;

module.exports = new Router({
	catch_all : /^\/users/,
	routes : [{
		match : /^\/users$/,
		GET : function (uri_bundle, view) {
			var users_promise = this.models['user'].getAll();
			users_promise.ready(function (users) {
				view.set('users', users);
				view.render('many.html');
			})
		},
		options : {
			modes : ['text/html']
		}
	},{
		match : /^\/users\/(\d+)$/,
		GET : function (uri_bundle, view) {
			var user_promise = this.models['user'].load(uri_bundle.params.id);
			user_promise.ready(function (user) {
				console.log(user);
				view.set('user', user);	
				view.render('one.html');
			});

			user_promise.error(function (error) {
				view.statusError(error);
				console.log(error);
			});
		},
		options : {
			modes : ['text/html']
		},
		keys : ['id']
	}],
});