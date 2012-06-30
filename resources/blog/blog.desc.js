module.exports = {
	name : 'blog',
	routes : [{ 
		match : /^\/posts$/,
		modes : ['text/html'],
		GET : function (uri_bundle, view) {
			
			

			view.set('post', post);

			// should this view.child load templates from the blog folder? or from the user folder?
			this.getResource('user').request('/users/' + post.user_id, view.child('author'));
			view.render('many.html');
		},
		POST : function (uri_bundle, view) {


		},
		options : {
			keys : ['id']
		}
	}, {
		match : /^\/posts\/(\d+)$/,
		modes : ['text/html'],
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
		options : {
			keys : ['id']
		}
	}],
	unmatched_route : {
		GET : function (uri_bundle, view) {
			console.log('unmatched route');
			console.log(uri_bundle);
			view.statusNotFound('404.html');
		},
	},
	dependencies : [
		'user'
	],
	models : {
		'post' : require('./models/post.model')
	},
	config : {
	}
};
