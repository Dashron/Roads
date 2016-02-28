"use strict";
/**
* root.js
* Copyright(c) 2016 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

var roads = require(__dirname + '/../../../index');
var Resource = roads.Resource;
var Response = roads.Response;

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
		GET : function (url, body, headers) {
			return new Response({
				"users" : "/users",
				"posts" : "/posts"
			});
		}
	}
});