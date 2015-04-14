"use strict";

var roads = require(__dirname + '/../../../index');
var Resource = roads.Resource;
var Response = roads.Response;

var Posts = require('../mock_db/posts');
var Users = require('../mock_db/users');
var userRepresentation = require('../representations/user');
var postRepresentation = require('../representations/post');
var collectionRepresentation = require('../representations/collection');
/**
 * [one description]
 * @type {Resource}
 */
module.exports.one = new Resource({
	methods : {
		GET : function* (url, body, headers) {
			if (!url.args.post_id) {
				throw new roads.HttpError('post', 404);
			}

			var post = yield Posts.get('id=' + url.args.post_id);

			if (!post) {
				throw new roads.HttpError('post', 404);
			}

			post.user = yield Users.get('id=' + post.user_id);

			return new Response(postRepresentation(post));
		}
	}
});

/**
 * [many description]
 * @type {Resource}
 */
module.exports.many = new Resource({
	resources : {
		'#post_id' : module.exports.one
	},
	methods : {
		GET : function* (url, body, headers) {
			var posts = yield Posts.get('all');

			var users = [];

			for (let i = 0; i < posts.length; i++) {
				// This is lazy. If you add an array yieldHandler you could yield every users in parallel.
				users.push(yield Users.get('id=' + posts[i].user_id));
			}

			// this is super lazy. don't try this at home
			posts.forEach(function (post) {
				users.forEach(function (user) {
					if (post.user_id === user.id) {
						post.user = user;
					}
				});
			});

			return new Response(collectionRepresentation(posts, postRepresentation));
		}
	}
});