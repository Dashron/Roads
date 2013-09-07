"use strict";

module.exports = {
	many : {
		GET : function (request, view) {
			var post_request = null;
			var _self = this;
			var sort = request.url.query.sort;
			var pager = {
				page : request.url.query.page,
				per_page : request.url.query.per_page
			};

			if (request.url.query.user) {
				this.project('official/user').model('user').load(request.url.query.user)
					.ready(function (user) {
						if (user) {
							_self.model('post').getForUser(user, pager, sort).preload('user_id')
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
				_self.model('post').getAll(pager, sort).preload('user_id')
					.ready(function (posts) {
						if (request.cur_user) {
							view.set('authenticated_user', request.cur_user);
							view.child('add').render('add.html');
						}

						view.set('posts', posts);
						view.render('many.html');
					})
					.error(view);
			}
		},
		POST : function (request, view) {
			var _self = this;

			if (request.cur_user) {
				var post = new (_self.model('post')).Model();
				post.title = request.body.title;
				post.body = request.body.body;
				post.user_id = request.cur_user.id;

				post.save()
					.ready(function (post) {
						view.statusRedirect('/?sort=alphabetical');
					})
					.error(view)
					.validationError(function (errors) {
						view.set('invalid_fields', errors);
						view.render('add.html');
					});
			} else {
				view.statusUnauthorized();
			}
		}
	}, 
	one : {
		GET : function (request, view) {
			// todo: maybe we can have a common template that loads the post from the id url. some of this code matches DELETE and PATCH
			var _self = this;

			if (!request.url.query.id) {
				return view.statusNotFound();
			}

			_self.model('post').load(request.url.query.id)
				.preload('user_id')
				.ready(function (post) {
					view.set('post', post);
					console.log(post);
					if (request.cur_user && request.cur_user.id === post.user_id) {
						view.render('one.auth.html');
					} else {
						view.render('one.html');
					}
				})
				.error(view);
		},
		DELETE : function (request, view) {
			// todo: maybe we can have a common template that loads the post from the id url. tons of this code matches GET and PATCH
			var _self = this;
			
			if (!request.url.query.id) {
				return view.statusNotFound();
			}

			if (!request.cur_user) {
				return view.statusUnauthorized();
			}

			_self.model('post').load(request.url.query.id)
				.ready(function (post) {
					if (!post) {
						return  view.statusNotFound();
					}

					if (post.user_id !== request.cur_user.id) {
						return view.statusUnauthorized();
					} else {
						post.delete()
							.ready(function () {
								view.statusRedirect('/posts');
							})
							.error(view);
					}
				})
				.error(view);
		},
		PATCH : function (request, view) {
			// todo: maybe we can have a common template that loads the post from the id url. tons of this code matches GET and DELETE
			var _self = this;
			var body = request.body.body;
			var title = request.body.title;

			if (!request.url.query.id) {
				return view.statusNotFound();
			}

			if (!request.cur_user) {
				return view.statusUnauthorized();
			}

			_self.model('post').load(request.url.query.id)
				.ready(function (post) {
					if (!post) {
						return  view.statusNotFound();
					}

					if (post.user_id !== request.cur_user.id) {
						return view.statusUnauthorized();
					} else {
						var update = false;

						if (body) {
							post.body = body;
							update = true;
						}

						if (title) {
							post.title = title;
							update = true;
						}

						post.save()
							.error(view)
							.ready(function () {
								view.statusRedirect('/posts/' + post.id);
							})
							.validationError(function (errors) {
								view.set('invalid_fields', errors);
								view.render('add.html');
							});
					}
				});
		}
	},
};