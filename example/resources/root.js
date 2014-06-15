var Resource = require('../../lib/resource').Resource;
var Response = require('../../lib/response').Response;
var Promise = require('bluebird');

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
			return new Response(Promise.coroutine(function* () {
				return {
					"users" : "/users",
					"posts" : "/posts"
				};
			})());
		}
	}
});