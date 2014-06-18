var Resource = require('../../lib/resource');
var Response = require('../../lib/response');

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
		GET : function* (request) {
			return new Response(this.representations.user(yield Users.get('id=1')));
		}
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
			return new Response(this.representations.collection(yield Users.get('all'), this.representations.user));
		}
	}
});