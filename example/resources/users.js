var roads = require('../../index');
var Resource = roads.Resource;
var Response = roads.Response;

var Users = require('../mock_db/users');

/**
 * [one description]
 * @type {Resource}
 */
module.exports.one = new Resource({
	resources : {
		'posts' : require('./user/user.posts').many
	},
	methods : {
		GET : function* (url, body, headers) {
			if (!url.args.user_id) {
				return new Response(this.representations.server.notFound(url.pathname, 'user'), 404);
			}

			var user = yield Users.get('id=' + url.args.user_id);

			if (!user) {
				return new Response(this.representations.server.notFound(url.pathname, 'user'), 404);
			}

			return new Response(this.representations.user(user));
		}
	}
});

/**
 * [many description]
 * @type {Resource}
 */
module.exports.many = new Resource({
	resources : {
		'#user_id' : module.exports.one
	},
	methods : {
		GET : function* (url, body, headers) {
			return new Response(this.representations.collection(yield Users.get('all'), this.representations.user));
		}
	}
});