"use strict";
var Config = require('../../../../base/config');

module.exports = {
	me : {
		GET : function* (request, view) {
			var project = this;

			if (!request.cur_user) {
				return view.statusUnauthorized();
			}

			view.set('user', request.cur_user);
			view.render('one.auth');
		},
		POST : function* (request, view) {
			var user = yield this.model('users').load(request.body.email, 'email');

			if (user && user.checkPassword(request.body.password)) {
				console.log('stuff');
				var session = yield this.model('sessions').start(request, user, {
					expires : new Date(2015, 0, 1)
				});

				view.statusRedirect('/');
			} else {
				view.set('password_fail', 'true');
				view.render('login');
			}
		},
		DELETE : function* (request, view) {
			yield this.model('sessions').stop(request)
			view.statusRedirect('/');
		}
	},
	one : {
		GET : function* (request, view) {
			var project = this;

			var user = yield this.model('users').load(request.url.query.user_id)

			if (!user) {
				return view.statusNotFound('server/404');
			}

			view.set('user', user);

			view.set('permissions', Config.get('web.user.permissions'));
			view.set('user_permissions', user.getPermissions().toArray());

			if (request.cur_user && (request.cur_user.id == request.url.query.user_id || request.cur_user.hasPermission('users.edit'))) {
				if (request.cur_user.hasPermission('users.edit')) {
					view.set('can_edit_permissions', true);
				}
				view.render('one.auth');
			} else {
				view.render('one');
			}
			
		},
		DELETE : function* (request, view) {
			if (!request.cur_user || !request.cur_user.hasPermission('users.create') || request.cur_user.id != request.url.query.user_id) {
				// todo: role based auth
				return view.statusUnauthorized();
			}

			var user = yield this.model('users').load(request.url.query.user_id)
				
			if (!user) {
				return view.statusNotFound('server/404');
			}

			yield user.delete()
			view.statusRedirect('/users');
		},
		PATCH : function* (request, view) {
			// edit users permission allows you to edit any users, and to update your own permissions
			if (!request.cur_user || !(request.cur_user.id == request.url.query.user_id || request.cur_user.hasPermission('users.edit'))) {
				// todo: role based auth
				return view.statusUnauthorized();
			}

			var user = yield this.model('users').load(request.url.query.user_id);

			if (!user) {
				return view.statusNotFound('server/404');
			}

			user.email = request.body.email;
			user.name = request.body.name;

			if (request.cur_user.hasPermission('users.edit')) {
				// Note, this isn't really valid for a patch. We should be making a PUT request if we want to update the entire state of the 
				// permissions whether or not hte key is provided
				user.getPermissions().reset();

				if (request.body.permissions) {
					if (!Array.isArray(request.body.permissions)) {
						request.body.permissions = [request.body.permissions];
					}

					for (var i = 0; i < request.body.permissions.length; i++) {
						user.getPermissions().enable(request.body.permissions[i]);
					}
				}
			}

			if (user.checkPassword(request.body.old_password) && request.body.new_password) {
				user.password = request.body.new_password;
			}

			var saved_user = yield user.save()
				.validationError(function (invalid_fields) {
					view.set('invalid_fields', invalid_fields);
					view.render('one');
				});

			view.statusRedirect('/users/' + saved_user.id);
		}
	},
	many : {
		GET : function* (request, view) {
			var users = yield this.model('users').getAll()

			view.set('users', users);

			if (request.cur_user) {
				view.set('can_create_users', request.cur_user.hasPermission('users.create'));
			}

			view.set('permissions', Config.get('web.user.permissions'));
			view.render('many');
		},
		POST : function* (request, view) {
			if (!request.cur_user || !request.cur_user.hasPermission('users.create')) {
				// todo: role based auth
				return view.statusUnauthorized();
			}

			var user = new (this.model('users').Model)();
			user.email = request.body.email;
			user.password = request.body.password;
			user.name = request.body.name;
			
			var saved_user = yield user.save()
			view.statusRedirect('/users/' + user.id);
		}
	}
};
