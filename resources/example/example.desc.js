module.exports = {
	name : 'example',
	uri : '/',
	default_template : 'index.html',
	routes : [{ 
		match : /.*/,
		fn : function (uri_bundle, view) {
			//console.log(uri_bundle);
			view.render();
		},
		options : {
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