var Resource = require('../../lib/resource').Resource;
var Response = require('../../lib/response').Response;

var UserRepresentation = require('../representations/user');

/**
 * [one description]
 * @type {Resource}
 */
module.exports.one = new Resource({
	resources : {
		'posts' : require('./user/user.posts').many
	}	
});

/**
 * [many description]
 * @type {Resource}
 */
module.exports.many = new Resource({
	resources : {
		'#id' : module.exports.one
	},
	methods : {
		GET : function* (request) {
			var users = yield users_model.getAll();

			return new Response(CollectionRepresentation(users, UserRepresentation));
		}
	}
});