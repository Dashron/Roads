"use strict";

module.exports = {
	one : {
		GET : function (request, view) {
			var project = this;

			this.model('{{SUBPROJECT_PLURAL}}').load(request.url.query.{{SUBPROJECT_SINGLE}}_id)
				.error(view)
				.ready(function ({{SUBPROJECT_SINGLE}}) {
					if (!{{SUBPROJECT_SINGLE}}) {
						return view.statusNotFound('server/404');
					}

					view.set('{{SUBPROJECT_SINGLE}}', {{SUBPROJECT_SINGLE}});

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

			this.model('{{SUBPROJECT_PLURAL}}').load(request.url.query.{{SUBPROJECT_SINGLE}}_id)
				.error(view)
				.ready(function ({{SUBPROJECT_SINGLE}}) {
					if (!{{SUBPROJECT_SINGLE}}) {
						return view.statusNotFound('server/404');
					}

					{{SUBPROJECT_SINGLE}}.delete()
						.error(view)
						.ready(function () {
							view.statusRedirect('/{{SUBPROJECT_PLURAL}}');
						});
				});
		},
		PATCH : function (request, view) {
			if (!request.cur_user) {
				// todo: role based auth
				return view.statusUnauthorized();
			}

			this.model('{{SUBPROJECT_PLURAL}}').load(request.url.query.{{SUBPROJECT_SINGLE}}_id)
				.error(view)
				.ready(function ({{SUBPROJECT_SINGLE}}) {
					if (!{{PROJECT_SINGLE}}) {
						return view.statusNotFound('server/404');
					}

					/*image_token
					image_id
					x
					y
					height
					width*/

					{{SUBPROJECT_SINGLE}}.save()
						.error(view)
						.validationError(function (invalid_fields) {
							view.set('invalid_fields', invalid_fields);
							view.render('one');
						})
						.ready(function ({{SUBPROJECT_SINGLE}}) {
							view.statusRedirect('/{{SUBPROJECT_PLURAL}}/' + {{SUBPROJECT_SINGLE}}.id);
						});
				});
		}
	},
	many : {
		GET : function (request, view) {
			this.model('{{SUBPROJECT_PLURAL}}').getAll()
				.error(view)
				.ready(function ({{SUBPROJECT_PLURAL}}) {
					view.set('{{SUBPROJECT_PLURAL}}', {{SUBPROJECT_PLURAL}});
					view.render('many');
				});
		},
		POST : function (request, view) {
			if (!request.cur_user) {
				// todo: role based auth
				return view.statusUnauthorized();
			}

			var {{SUBPROJECT_SINGLE}} = new (this.model('{{SUBPROJECT_PLURAL}}').Model)();
			
			{{SUBPROJECT_SINGLE}}.save()
				.error(view)
				.ready(function ({{SUBPROJECT_SINGLE}}) {
					view.statusRedirect('/{{SUBPROJECT_PLURAL}}/' + {{SUBPROJECT_SINGLE}}.id);
				});
		}
	}
};