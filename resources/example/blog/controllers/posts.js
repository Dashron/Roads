"use strict";

module.exports = {
	many : {
		GET : function (request, view) {
			var post_request = null;
			var _self = this;

			if (request.url.query.user) {
				this.resource('official/user').model('user').load(request.url.query.user)
					.ready(function (user) {
						if (user) {
							_self.model('post').getForUser(user).preload('user_id')
								.ready(function (posts) {
									view.set('posts', posts);
									view.render('many.html');
								})
								.error(view);
						} else {
							view.statusNotFound();
						}
					})
					.error(view);
			} else {
				this.model('post').getAll().preload('user_id')
					.ready(function (posts) {
						view.set('posts', posts);
						view.child('add').render('add.html');
						view.render('many.html');
					})
					.error(view);
			}
		},
		POST : function (request, view) {
			var _self = this;

			this.resource('official/user').model('session').getUser(request)
				.ready(function (user) {
					if (user) {
						var post = new (_self.model('post')).Model();
						post.title = request.body.title;
						post.body = request.body.body;
						post.user_id = user.id;

						post.save()
							.ready(function (post) {
								view.statusRedirect('/blog/posts');
							})
							.error(view)
							.validationError(function (errors) {
								view.set('invalid_fields', errors);
								view.render('add.html');
							});
					} else {
						view.statusUnauthorized();
					}
				})
				.error(view);
		}
	}, 
	one : {
		GET : function (request, view) {
			
			//view.set('post', post);

			// should this view.child load templates from the blog folder? or from the user folder?
			//this.resource('user').request('/users/' + post.user_id, view.child('author'));
			view.render('one.html');
		},
		PUT : function (request, view) {

			//view.redirect('/posts/' + post.id);
		},
		PATCH : function (request, view) {

			//view.redirect('/posts/' + post.id);
		}
	},
};