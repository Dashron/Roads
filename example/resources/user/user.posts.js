"use strict";

var roads = require('../../../index');
var Resource = roads.Resource;
var Response = roads.Response;

var Posts = require('../../mock_db/posts');

/**
 * [one description]
 * @type {Resource}
 */
module.exports.one = new Resource({
	methods : {
		GET : function* (url, body, headers) {
			if (!url.args.user_id) {
				return new Response(this.representations.server.notFound(url.pathname, 'user'), 404);
			}

			if (!url.args.post_id) {
				return new Response(this.representations.server.notFound(url.pathname, 'post'), 404);
			}

			var post = yield Posts.get('id=' + url.args.post_id);

			if (!post || post.user_id != url.args.user_id) {
				return new Response(this.representations.server.notFound(url.pathname, 'post'), 404);
			}

			return new Response(this.representations.post(post));
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
				return new Response(this.representations.server.notFound(url.pathname, 'user'), 404);
			}

			return new Response(this.representations.collection(yield Posts.get('user_id=' + url.args.user_id), this.representations.post));
		}
	}
});