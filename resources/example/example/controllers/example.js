"use strict";

module.exports = {
	main : {
		GET : function (request, view) {
			this.resource('official/user')
				.request({
					controller : 'user',
					view : 'auth',
					request : request
				}, 
				view.child('login', 'current_user_widget.html')
			);

			this.resource('example/blog')
				.request({
					controller : 'posts',
					view : 'many',
					request : request
				}, 
				view.child('posts')
			);
			
			view.render('index.html');
		}
	}
};