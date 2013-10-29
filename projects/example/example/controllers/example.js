"use strict";

module.exports = {
	main : {
		GET : function (request, view) {
			view.set('cur_user', request.cur_user);

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
