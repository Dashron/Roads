var Router = require('../../components/router').RegexRouter;
var Resource = require('../../components/resource').Resource;

module.exports = new Router({
	routes : {
		public : [{ 
			match : /^\/$/,
			GET : function (uri_bundle, view) {
				var resource = this.resources.user;
				resource.request('/users/1', view.child('user'));
				resource.request('/users/5', view.child('user_two'));
				this.request('/private', view.child('private'));

				view.set('cookie_old_value', uri_bundle.cookie.get('date'));
				var date = new Date().toString();
				
				if (uri_bundle.cookie.get('second_date')) {
					uri_bundle.cookie.delete('second_date');
				} else {
					uri_bundle.cookie.set('second_date', { value : date, domain : '127.0.0.1' });
				}

				uri_bundle.cookie.set('date', { value : date , domain : '127.0.0.1' });
				view.set('cookie_new_value', date);
				view.render('index.html');
			},
			options : {
				modes : ['text/html']
			}
		}],
		private : [{
			match : /^\/private$/,
			GET : function (uri_bundle, view) {
				view.render('private.html');
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