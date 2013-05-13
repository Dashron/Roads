"use strict";

module.exports = {
	main : function (request, view, route) {
		var child = view.child('content');
		view.render('template.html');
		route(request, child);
	}
};