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
					view.render('login.html');
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
							view.statusRedirect('/');
						});

						session_request.error(view.statusError.bind(view));
					} else {
						view.set('password_fail', 'true');
						view.render('login.html');
					}
				});

				user_request.error(view.statusError.bind(view));
			}
		},{
			match : /^\/users$/,
			GET : function (uri_bundle, view) {
				var users_promise = this.models.user.getAll();

				users_request.ready(function (users) {
					view.set('users', users);
					view.render('many.html');
				});

				users_request.error(view.statusError.bind(view));
			}
		},{
			match : /^\/users\/(\d+)$/,
			GET : function (uri_bundle, view) {
				var user_request = this.models.user.load(uri_bundle.params.id);
				user_request.ready(function (user) {
					if (user === null && uri_bundle.source === "server") {
						view.statusNotFound('404.html');
					} else {
						view.set('user', user);	
						view.render('one.html');
					}
				});

				user_request.error(view.statusError.bind(view));
			},
			keys : ['id']
		}]
	}
});