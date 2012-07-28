var Router = require('../../components/router').RegexRouter;
var Resource = require('../../components/resource').Resource;

module.exports = new Router({
	catch_all : /^\/posts/,
	routes : {
		public : [{ 
			match : /^\/posts$/,
			GET : function (uri_bundle, view) {
				var post_promise = null;
				if (uri_bundle.params.user_id) {
					post_promise = this.models.post.getForUser(uri_bundle.params.user_id);
					post_promise.preload((new Resource('User')).models.user);
				} else {
					post_promise = this.models.post.getAll();
					post_promise.preload('user_id', (new Resource('User')).models.user);
				}

				// this actually has to be assigned before the preload to work.
				// fix that
				post_promise.ready(function (posts) {
					view.set('posts', posts);
					view.render('many.html');
				});
			},
			POST : function (uri_bundle, view) {


			},
			keys : ['id'],
			options : {
				modes : ['text/html']
			}
		}, {
			match : /^\/posts\/(\d+)$/,
			GET : function (uri_bundle, view) {
				
				

				view.set('post', post);

				// should this view.child load templates from the blog folder? or from the user folder?
				this.getResource('user').request('/users/' + post.user_id, view.child('author'));
				view.render('one.html');
			},
			PUT : function (uri_bundle, view) {

				view.redirect('/posts/' + post.id);
			},
			PATCH : function (uri_bundle, view) {

				view.redirect('/posts/' + post.id);
			},
			keys : ['id'],
			options : {
				modes : ['text/html']
			}
		}],
	}
});
