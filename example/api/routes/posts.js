"use strict";
/**
* posts.js
* Copyright(c) 2017 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

var roads = require(__dirname + '/../../../index');
var Resource = roads.Resource;
var Response = roads.Response;

var Posts = require('../mock_db/posts');
var Users = require('../mock_db/users');
var postRepresentation = require('../representations/post');
var collectionRepresentation = require('../representations/collection');
/**
 * [one description]
 * @type {Resource}
 */
module.exports.one = new Resource({
	methods : {
		GET : async function (url, body, headers) {
			if (!url.args.post_id) {
				throw new roads.HttpError('post', roads.HttpError.not_found);
			}

			var post = await Posts.get('id=' + url.args.post_id);

			if (!post) {
				throw new roads.HttpError('post', roads.HttpError.not_found);
			}

			post.user = await Users.get('id=' + post.user_id);

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
		GET : async function (url, body, headers) {
			var posts = await Posts.get('all');

			var users = [];

			for (let i = 0; i < posts.length; i++) {
				// This is lazy. If you add an array awaitHandler you could await every users in parallel.
				users.push(await Users.get('id=' + posts[i].user_id));
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