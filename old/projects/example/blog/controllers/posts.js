"use strict";

module.exports = {
	many : {
		GET : function* (request, view) {
			var post_request = null;
			var _self = this;
			var sort = request.url.query.sort;
			var pager = {
				page : request.url.query.page,
				per_page : request.url.query.per_page
			};

			// move this to /users/id/blog
			if (request.url.query.user) {
				var user = yield this.project('official/users')
					.model('users')
					.load(request.url.query.user);

				var posts = yield _self.model('posts')
					.getForUser(user, pager, sort)
					.preload('user_id');

				view.set('posts', posts);
				view.render('many');
			} else {
				if (sort && sort != "alphabetical") {
					view.statusRedirect(request.url.path);
				}
				
				var posts = yield _self.model('posts')
					.getAll(pager, sort)
					.preload('user_id');

				if (request.cur_user) {
					view.set('cur_user', request.cur_user);
					view.child('add').render('add');
				}

				view.set('posts', posts);
				view.render('many');
			}
		},
		POST : function* (request, view) {
			var _self = this;

			if (request.cur_user && request.cur_user.hasPermission('posts.create')) {
				var post = new (_self.model('posts')).Model();
				post.title = request.body.title;
				post.body = request.body.body;
				post.user_id = request.cur_user.id;

				var post = yield post.save()
					.validationError(function (errors) {
						view.set('invalid_fields', errors);
						view.render('add');
					});

				view.statusRedirect('/?sort=alphabetical');
			} else {
				view.statusUnauthorized();
			}
		}
	}, 
	one : {
		GET : function* (request, view) {
			// todo: maybe we can have a common template that loads the post from the id url. some of this code matches DELETE and PATCH
			var _self = this;

			if (!request.url.query.id) {
				return view.statusNotFound();
			}

			var post = yield _self.model('posts').load(request.url.query.id)
				.preload('user_id');

			if (!post) {
				return view.statusNotFound();
			}

			view.set('post', post);
			if (request.cur_user && request.cur_user.id === post.user_id) {
				view.render('one.auth');
			} else {
				view.render('one');
			}
		},
		DELETE : function* (request, view) {
			// todo: maybe we can have a common template that loads the post from the id url. tons of this code matches GET and PATCH
			var _self = this;
			
			if (!request.url.query.id) {
				return view.statusNotFound();
			}

			if (!request.cur_user || !request.cur_user.hasPermission('posts.create')) {
				return view.statusUnauthorized();
			}

			var post = yield _self.model('posts').load(request.url.query.id);
				
			if (!post) {
				return  view.statusNotFound();
			}

			if (post.user_id !== request.cur_user.id) {
				return view.statusUnauthorized();
			} else {
				var post = yield post.delete();
				view.statusRedirect('/posts');
			}
		},
		PATCH : function* (request, view) {
			// todo: maybe we can have a common template that loads the post from the id url. tons of this code matches GET and DELETE
			var _self = this;
			var body = request.body.body;
			var title = request.body.title;

			if (!request.url.query.id) {
				return view.statusNotFound();
			}

			if (!request.cur_user || !request.cur_user.hasPermission('posts.edit')) {
				return view.statusUnauthorized();
			}

			var post = yield _self.model('posts').load(request.url.query.id);
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

				var saved_post = yield post.save()
					.validationError(function (errors) {
						view.set('invalid_fields', errors);
						view.render('add');
					});

				view.statusRedirect('/posts/' + post.id);
			}
		}
	},
};
