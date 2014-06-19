var roads = require('../../index');
var Resource = roads.Resource;
var Response = roads.Response;
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