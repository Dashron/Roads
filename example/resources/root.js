"use strict";

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
		GET : function* (url, body, headers) {
			return new Response({
				"users" : "/users",
				"posts" : "/posts"
			});
		}
	}
});