"use strict";
/**
* users.js
* Copyright(c) 2016 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

var roads = require(__dirname + '/../../../index');
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
		},
		PATCH : function* (url, body, headers) {
			if (!url.args.user_id) {
				throw new roads.HttpError('User not found', 404);
			}

			var user = yield Users.get('id=' + url.args.user_id);

			if (!user) {
				throw new roads.HttpError('User not found', 404);
			}

			if (body.name) {
				user.name = body.name;
			}

			if (body.email) {
				user.email = body.email;
			}

			return new Response(userRepresentation(user), 201);
		},
		DELETE : function* (url, body, headers) {
			if (!url.args.user_id) {
				throw new roads.HttpError('User not found', 404);
			}

			var user = yield Users.get('id=' + url.args.user_id);

			if (!user) {
				throw new roads.HttpError('User not found', 404);
			}

			yield user.delete();

			return new Response(null, 204);
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
		},
		POST : function* (url, body, headers) {
			var user = {};

			if (body.name) {
				user.name = body.name;
			} else {
				throw new roads.HttpError('You must provide a user name when creating users', 400);
			}

			if (body.email) {
				user.email = body.email;
			} else {
				throw new roads.HttpError('You must provide a user email when creating users', 400);
			}

			return new Response(userRepresentation(user), 201);
		}
	},
	resource_context: {
		cors_methods : ['GET']
	}
});
