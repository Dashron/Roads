var Router = require('../../components/router').RegexRouter;
var Resource = require('../../components/resource').Resource;


var view_component = require('../../components/view');
var Resource = require('../../components/resource').Resource;

module.exports = new Resource('example', {
	construct : function () {
		var renderers = require('./example.renderers');
		var key = null;

		for (key in renderers) {
			console.log('adding renderer: ' + key);
			view_component.addRenderer(key, renderers[key]);
		}
	},
	onRequest : function (uri_bundle, view, route, route_resource) {
		if (uri_bundle.public) {
			var child = view.child('content');
			view.set('title', 'hello world');
			view.render('template.html');
			route.call(route_resource, uri_bundle, child);
		} else {
			route.call(route_resource, uri_bundle, view);
		}
	},
	router : require('./example.router'),
	dependencies : {
		"user" : require('../user/user.resource'),
		"blog" : require('../blog/blog.resource'),
		"static" : require('../static/static.resource')
	}
});


module.exports = new Router({
	routes : {
		public : [{ 
			match : /^\/$/,
			GET : function (uri_bundle, view) {
				this.resources.user.request({
					uri: '/users/login',
					cookie: uri_bundle.cookie,
					headers: uri_bundle.headers
				}, view.child('login', 'current_user_widget.html'));

				this.resources.user.request({
					uri: '/users/1/posts',
					params: {
						sort : 'recent',
					}
				}, view.child('posts'));

				view.error(function (error) {
					console.log(error);
					this.statusError(error, '500.html');
				});
				
				view.render('index.html');
			}
		}]
	},
	default_route : {
		GET : function (uri_bundle, view) {
			console.log('unmatched route');
			console.log(uri_bundle.uri);
			view.statusNotFound('404.html');
		},
		options : {
			modes : ['text/html']
		}
	}
});
