"use strict";

module.exports = {
	main : {
		GET : function (request, view) {
			/*this.resource('official/user')
				.request({
					controller : 'user',
					view : 'auth'
				}, 
				view.child('login', 'current_user_widget.html')
			);

			this.resource('example/blog')
				.request({
					path : '/blog/posts',
					query : {
						sort : 'newest'
					}
				}, 
				view.child('posts')
			);*/
			
			view.render('index.html');
		}
	}
};