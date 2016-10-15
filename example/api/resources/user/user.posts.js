"use strict";
/**
* user.posts.js
* Copyright(c) 2016 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

var roads = require(__dirname + '/../../../../index');
var Resource = roads.Resource;
var Response = roads.Response;

var Posts = require('../../mock_db/posts');
var postRepresentation = require('../../representations/post');
var collectionRepresentation = require('../../representations/collection');

/**
 * [one description]
 * @type {Resource}
 */
module.exports.one = new Resource({
	methods : {
		GET : function* (url, body, headers) {
			if (!url.args.user_id) {
				throw new roads.HttpError('user', roads.HttpError.not_found);
			}

			if (!url.args.post_id) {
				throw new roads.HttpError('post', roads.HttpError.not_found);
			}

			var post = yield Posts.get('id=' + url.args.post_id);

			if (!post || post.user_id !== url.args.user_id) {
				throw new roads.HttpError('post', roads.HttpError.not_found);
			}

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
			if (!url.args.user_id) {
				throw new roads.HttpError('user', roads.HttpError.not_found);
			}

			return new Response(collectionRepresentation(yield Posts.get('user_id=' + url.args.user_id), postRepresentation));
		}
	}
});