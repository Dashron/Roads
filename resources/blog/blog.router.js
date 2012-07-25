var Router = require('../../components/router').RegexRouter;

module.exports = new Router({
	catch_all : /^\/posts/,
	routes : {
		public : [{ 
			match : /^\/posts$/,
			GET : function (uri_bundle, view) {
				
				

				view.set('post', post);

				// should this view.child load templates from the blog folder? or from the user folder?
				this.getResource('user').request('/users/' + post.user_id, view.child('author'));
				view.render('many.html');
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