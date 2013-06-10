"use strict";

module.exports = {
	main : {
		GET : function (request, view, route) {
			var child = view.child('content');
			var this_resource = this;

			view.render('template.html');

			if (request.next_route) {
				route(request, child, function (request, route) {
					this_resource.request(request.next_route);
				});
			} else {
				route(request, child);
			}
		}
	}
};
