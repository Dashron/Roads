"use strict";

module.exports = {
	main : {
		GET : function (request, view) {
			this.project('official/users')
				.render({
					controller : 'users',
					view : 'auth'
				}, 
				request, view.child('login', 'current_user_widget')
			);

			this.project('example/blog')
				.render({
					controller : 'posts',
					view : 'many'
				}, 
				request, view.child('posts')
			);
			
			view.render('index');
		}
	}
};
