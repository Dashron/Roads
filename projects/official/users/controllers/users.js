"use strict";

module.exports = {
	auth : {
		GET : function (request, view) {
			this.model('sessions').getUser(request)
				.ready(function (user) {
					view.set('user', user);
					view.render('login.html');
				})
				.error(view);
		},
		POST : function (request, view) {
			var project = this;
			this.model('users').load(request.body.email, 'email')
				.ready(function (user) {

					if (!user) {
						view.set('password_fail', 'true');
						view.render('login.html');
					} else {
						// validate password
						if (user.checkPassword(request.body.password)) {
							project.model('sessions').start(request, user)
								.ready(function (session) {
									view.statusRedirect('/');
								})
								.error(view);
						} else {
							view.set('password_fail', 'true');
							view.render('login.html');
						}
					}
				})
				.error(view);
		},
		DELETE : function (request, view) {
			this.model('sessions').stop(request)
				.ready(function () {
					view.statusRedirect('/');
				})
				.error(view);
		}
	},
	many : {
		GET : function (request, view) {
			this.model('users').getAll()
				.ready(function (users) {
					view.set('users', users);
					view.render('many.html');
				})
				.error(view);
		}
	},
	one : {
		GET : function (request, view) {
			this.model('users').load(request.url.query.id)
				.ready(function (user) {
					if (user === null && request.source === "server") {
						view.statusNotFound('404.html');
					} else {
						view.set('user', user);	
						view.render('one.html');
					}
				})
				.error(view);
		}
	}/*,
	{
			match : /^\/users\/(\d+)\/posts$/,
			GET : function (request, view) {
				var project = this;
				var user_request = this.models.user.load(request.params.id);

				user_request.ready(function (user) {
					if (user === null) {
							view.statusNotFound('404.html');
					} else {
						view.set('user', user);
						// this will not work. it should be a request through the blog system
						project.projects.blog.request({
							uri: '/posts',
							prefix: {
								model : user
							}
						}, view);
					}
				});

				user_request.error(view.statusError.bind(view));
			},
			keys : ['id']
		}]
	}*/
};
