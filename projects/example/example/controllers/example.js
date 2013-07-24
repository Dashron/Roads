"use strict";

module.exports = {
	main : {
		GET : function (request, view) {
			var user_project = this.project('official/user');
			var blog_project = this.project('example/blog');

			user_project
				.render({
					controller : 'user',
					view : 'auth'
				}, 
				request, view.child('login', 'current_user_widget.html')
			);


			blog_project
				.render({
					controller : 'posts',
					view : 'many'
				}, 
				request, view.child('posts')
			);
			
			view.render('index.html');
		}
	}
};