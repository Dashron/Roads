var Router = require('../../components/router').RegexRouter;

module.exports = new Router({
	catch_all : /^\/users/,
	routes : {
		public : [{
			match : /^\/users\/login$/,
			GET : function (uri_bundle, view) {
				var session_request = this.models.session.getUser(uri_bundle.cookie, uri_bundle.headers);

				session_request.ready(function (user) {
					view.set('user', user);
					view.render('logged_in.html');
				});

				session_request.error(view.statusError.bind(view));
			},
			POST : function (uri_bundle, view) {
				var resource = this;
				var user_request = this.models.user.load(uri_bundle.params.email, 'email');

				// validate the login data
				user_request.ready(function (user) {
					// validate password
					if (user.checkPassword(uri_bundle.params.password)) {
						var session_request = resource.models.session.start(uri_bundle.headers, user, uri_bundle.cookie);
						session_request.ready(function (session) {
							view.statusRedirect('/users/login');
						});
						session_request.error(view.statusError.bind(view));
					} else {
						view.set('login', 'password fail');
						view.render('login.html');
					}
				});
			}
		},{
			match : /^\/users$/,
			GET : function (uri_bundle, view) {
				var users_promise = this.models.user.getAll();
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
				var user_promise = this.models.user.load(uri_bundle.params.id);
				user_promise.ready(function (user) {
					//if (user === null) {
						//view.statusNotFound('404.html');
					//} else {
						view.set('user', user);	
						view.render('one.html');
					//}
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
		}]
	}
});