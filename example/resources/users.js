var roads = require('../../index');
var Resource = roads.Resource;
var Response = roads.Response;

var Users = require('../mock_db/users');
var userRepresentation = require('../representations/user');
var collectionRepresentation = require('../representations/collection');

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
				throw new roads.HttpError('User not found', 404);
			}

			var user = yield Users.get('id=' + url.args.user_id);

			if (!user) {
				throw new roads.HttpError('User not found', 404);
			}

			return new Response(userRepresentation(user));
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
			return new Response(collectionRepresentation(yield Users.get('all'), userRepresentation));
		}
	}
});
