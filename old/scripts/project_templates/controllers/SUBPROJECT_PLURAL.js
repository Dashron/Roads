"use strict";

module.exports = {
	one : {
		GET : function (request, view) {
			var project = this;

			this.model('{{SUBPROJECT_PLURAL}}').load(request.url.query.{{SUBPROJECT_SINGULAR}}_id)
				.error(view)
				.ready(function ({{SUBPROJECT_SINGULAR}}) {
					if (!{{SUBPROJECT_SINGULAR}}) {
						return view.statusNotFound('server/404');
					}

					view.set('{{SUBPROJECT_SINGULAR}}', {{SUBPROJECT_SINGULAR}});

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

			this.model('{{SUBPROJECT_PLURAL}}').load(request.url.query.{{SUBPROJECT_SINGULAR}}_id)
				.error(view)
				.ready(function ({{SUBPROJECT_SINGULAR}}) {
					if (!{{SUBPROJECT_SINGULAR}}) {
						return view.statusNotFound('server/404');
					}

					{{SUBPROJECT_SINGULAR}}.delete()
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

			this.model('{{SUBPROJECT_PLURAL}}').load(request.url.query.{{SUBPROJECT_SINGULAR}}_id)
				.error(view)
				.ready(function ({{SUBPROJECT_SINGULAR}}) {
					if (!{{SUBPROJECT_SINGULAR}}) {
						return view.statusNotFound('server/404');
					}

					/*image_token
					image_id
					x
					y
					height
					width*/

					{{SUBPROJECT_SINGULAR}}.save()
						.error(view)
						.validationError(function (invalid_fields) {
							view.set('invalid_fields', invalid_fields);
							view.render('one');
						})
						.ready(function ({{SUBPROJECT_SINGULAR}}) {
							view.statusRedirect('/{{SUBPROJECT_PLURAL}}/' + {{SUBPROJECT_SINGULAR}}.id);
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

			var {{SUBPROJECT_SINGULAR}} = new (this.model('{{SUBPROJECT_PLURAL}}').Model)();
			
			{{SUBPROJECT_SINGULAR}}.save()
				.error(view)
				.ready(function ({{SUBPROJECT_SINGULAR}}) {
					view.statusRedirect('/{{SUBPROJECT_PLURAL}}/' + {{SUBPROJECT_SINGULAR}}.id);
				});
		}
	}
};