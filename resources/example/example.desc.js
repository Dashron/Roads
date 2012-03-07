module.exports = {
	name : 'example',
	uri : '/',
	default_template : 'index.html',
	routes : [{ 
		match : /^\/$/,
		GET : function (uri_bundle, view) {
			console.log(uri_bundle);
			this.request('/user/1', view.child('user'));
			view.render();
		},
		options : {
		}
	}, {
		match : /^\/user\/(\d+)$/,
		GET : function (uri_bundle, view) {
			console.log(uri_bundle);
			view.render('user.html');
		},
		options : {
			keys : ['id']
		}
	}],
	unmatched_route : function (uri_bundle, view) {
		console.log('unmatched route');
		console.log(uri_bundle);
		view.render();
	},
	dependencies : [
	],
	models : [
	],
	config : {
	}
};