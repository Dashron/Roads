"use strict";

module.exports = {
	me : {
		GET : function (request, view) {
			var project = this;

			if (!request.cur_user) {
				return view.statusUnauthorized();
			}

			view.set('user', request.cur_user);
			view.render('one.auth');
		},
		POST : function (request, view) {
			var project = this;
			this.model('users').load(request.body.email, 'email')
				.ready(function (user) {

					if (user && user.checkPassword(request.body.password)) {
						project.model('sessions').start(request, user, {
							expires : new Date(2015, 0, 1)
						}).ready(function (session) {
							view.statusRedirect('/');
						})
						.error(view);
					} else {
						view.set('password_fail', 'true');
						view.render('login');
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
	one : {
		GET : function (request, view) {
			var project = this;

			this.model('users').load(request.url.query.user_id)
				.error(view)
				.ready(function (user) {
					if (!user) {
						return view.statusNotFound('server/404');
					}

					view.set('user', user);

					if (request.cur_user) {
						view.render('one.auth');
					} else {
						view.render('one');
					}
				});
			
		},
		DELETE : function (request, view) {
			if (!request.cur_user) {
				// todo: role based auth
				return view.statusUnauthorized();
			}

			this.model('users').load(request.url.query.user_id)
				.error(view)
				.ready(function (user) {
					if (!user) {
						return view.statusNotFound('server/404');
					}

					user.delete()
						.error(view)
						.ready(function () {
							view.statusRedirect('/users');
						});
				});
		},
		PATCH : function (request, view) {
			if (!request.cur_user) {
				// todo: role based auth
				return view.statusUnauthorized();
			}

			this.model('users').load(request.url.query.user_id)
				.error(view)
				.ready(function (user) {
					if (!user) {
						return view.statusNotFound('server/404');
					}

					user.email = request.body.email;
					user.name = request.body.name;

					if (user.checkPassword(request.body.old_password) && request.body.new_password) {
						user.password = request.body.new_password;
					}

					user.save()
						.error(view)
						.validationError(function (invalid_fields) {
							view.set('invalid_fields', invalid_fields);
							view.render('one');
						})
						.ready(function (user) {
							view.statusRedirect('/users/' + user.id);
						});
				});
		}
	},
	many : {
		GET : function (request, view) {
			this.model('users').getAll()
				.error(view)
				.ready(function (users) {
					view.set('users', users);
					view.render('many');
				});
		},
		POST : function (request, view) {
			if (!request.cur_user) {
				// todo: role based auth
				return view.statusUnauthorized();
			}

			var user = new (this.model('users').Model)();
			user.email = request.body.email;
			user.password = request.body.password;
			user.name = request.body.name;
			
			user.save()
				.error(view)
				.ready(function (user) {
					view.statusRedirect('/users/' + user.id);
				});
		}
	}
};
