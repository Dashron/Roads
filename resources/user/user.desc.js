module.exports = {
	name : 'user',
	uri : '/users/',
	routes : [{
		match : /^(\d+)$/,
		GET : function (uri_bundle, view) {
			process.nextTick(function () {
				view.set('id', uri_bundle.params.id);
				view.render('user.html');
			});
		},
		options : {
			keys : ['id']
		}
	}],
	unmatched_route : {
		GET : function (uri_bundle, view) {
			console.log('unmatched route');
			console.log(uri_bundle);
			view.notFound('404.html');
		},
	},
	dependencies : [
	],
	models : {
		'user' : require('./models/user.model')
	},
	config : {
	}
};
