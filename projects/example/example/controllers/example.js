"use strict";

module.exports = {
	main : {
		GET : function (request, view) {

			this.project('example/blog')
				.render({
					controller : 'posts',
					view : 'many'
				}, 
				request, view.child('posts')
			);

			view.set('user', request.cur_user);
			view.render('index');
		}
	}
};
