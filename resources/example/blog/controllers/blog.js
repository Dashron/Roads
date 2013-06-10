"use strict";

module.exports = {
	many : {
		GET : function (request, view) {
			var post_request = null;
			if (uri_bundle.prefix.model) {
				post_request = this.model('post').getForUser(uri_bundle.prefix.model);
			} else {
				post_request = this.model('post').getAll();
			}

			// todo test
			post_request.preload('user_id', this.resource('User').model('user'));
			post_request.ready(function (posts) {
				view.set('posts', posts);
				view.render('many.html');
			});
		},
		POST : function (request, view) {
			/*var valid = this.models.post.validate({
				title : uri_bundle.title,
				body : uri_bundle.body
			});

			if (valid) {
				var post = new (this.models.post.Model)();
				post.title = valid.title;
				post.body = valid.body;
				//post.user_id = // We have to now implement sessions.
				post.save();
			}*/
		}
	}, 
	one : {
		GET : function (request, view) {
			
			view.set('post', post);

			// should this view.child load templates from the blog folder? or from the user folder?
			this.resource('user').request('/users/' + post.user_id, view.child('author'));
			view.render('one.html');
		},
		PUT : function (request, view) {

			view.redirect('/posts/' + post.id);
		},
		PATCH : function (request, view) {

			view.redirect('/posts/' + post.id);
		}
	},
};