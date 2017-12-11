"use strict";
/**
* applyRoutes.js
* Copyright(c) 2017 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

var Users = require('../mock_db/users');
var userRepresentation = require('../representations/user');
var collectionRepresentation = require('../representations/collection');

var Posts = require('../mock_db/posts');
var postRepresentation = require('../representations/post');
var collectionRepresentation = require('../representations/collection');

module.exports = function (api) {
	/**
	 * Root
	 */
	api.addRoute('GET', '/', function (url, body, headers) {
		return new this.Response({
			"users" : "/users",
			"posts" : "/posts"
		});
	});

	/**
	 * Many users
	 */
	api.addRoute('GET', '/users', async function (url, body, headers) {
		return new this.Response(collectionRepresentation(await Users.get('all'), userRepresentation));
	});

	api.addRoute('POST', '/users', function (url, body, headers) {
		var user = {};

		if (body.name) {
			user.name = body.name;
		} else {
			throw new roads.HttpError('You must provide a user name when creating users', roads.HttpError.invalid_request);
		}

		if (body.email) {
			user.email = body.email;
		} else {
			throw new roads.HttpError('You must provide a user email when creating users', roads.HttpError.invalid_request);
		}

		return new this.Response(userRepresentation(user), 201);
	});
	
	/**
	 * One user
	 */
	api.addRoute('GET', '/users/#user_id', async function (url, body, headers) {
		if (!url.args.user_id) {
			throw new roads.HttpError('User not found', roads.HttpError.not_found);
		}

		var user = await Users.get('id=' + url.args.user_id);

		if (!user) {
			throw new roads.HttpError('User not found', roads.HttpError.not_found);
		}

		return new this.Response(userRepresentation(user));
	});

	api.addRoute('PATCH', '/users/#user_id', async function (url, body, headers) {
		if (!url.args.user_id) {
			throw new roads.HttpError('User not found', roads.HttpError.not_found);
		}

		var user = await Users.get('id=' + url.args.user_id);

		if (!user) {
			throw new roads.HttpError('User not found', roads.HttpError.not_found);
		}

		if (body.name) {
			user.name = body.name;
		}

		if (body.email) {
			user.email = body.email;
		}

		return new this.Response(userRepresentation(user), 201);
	});

	api.addRoute('DELETE', '/users/#user_id', async function (url, body, headers) {
		if (!url.args.user_id) {
			throw new roads.HttpError('User not found', roads.HttpError.not_found);
		}

		var user = await Users.get('id=' + url.args.user_id);

		if (!user) {
			throw new roads.HttpError('User not found', roads.HttpError.not_found);
		}

		await user.delete();

		return new this.Response(null, 204);
	});

	/**
	 * Posts for one user
	 */
	api.addRoute('GET', '/users/#user_id/posts', async function (url, body, headers) {
		if (!url.args.user_id) {
			throw new roads.HttpError('user', roads.HttpError.not_found);
		}

		return new Response(collectionRepresentation(await Posts.get('user_id=' + url.args.user_id), postRepresentation));
	});

	api.addRoute('GET', '/users/#user_id/posts/#post_id', async function (url, body, headers) {
		if (!url.args.user_id) {
			throw new roads.HttpError('user', roads.HttpError.not_found);
		}

		if (!url.args.post_id) {
			throw new roads.HttpError('post', roads.HttpError.not_found);
		}

		var post = await Posts.get('id=' + url.args.post_id);

		if (!post || post.user_id !== url.args.user_id) {
			throw new roads.HttpError('post', roads.HttpError.not_found);
		}

		return new Response(postRepresentation(post));
	});


	/**
	 * Many Posts
	 */

	api.addRoute('GET', '/posts', async function (url, body, headers) {
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
	});


	/**
	 * One Post
	 */
	api.addRoute('GET', '/posts/#post_id', async function (url, body, headers) {
		if (!url.args.post_id) {
			throw new roads.HttpError('post', roads.HttpError.not_found);
		}

		var post = await Posts.get('id=' + url.args.post_id);

		if (!post) {
			throw new roads.HttpError('post', roads.HttpError.not_found);
		}

		post.user = await Users.get('id=' + post.user_id);

		return new Response(postRepresentation(post));
	});
};