var Resource = require('../../lib/resource').Resource;
var Response = require('../../lib/response').Response;

/**
 * [one description]
 * @type {Resource}
 */
module.exports.many = new Resource({
	resources : {
		'users' : require('./users').many,
		'posts' : require('./posts').many
	},
	methods : {
		GET : function* (request) {
			return new Response(function () {
				return {
					"users" : "/users",
					"posts" : "/posts"
				};
			});
		}
	}
});