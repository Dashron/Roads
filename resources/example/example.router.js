var Router = require('../../components/router').RegexRouter;
var Resource = require('../../components/resource').Resource;

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

				this.resources.user.request('/users/1', view.child('blog_user', 'byline.html'));
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