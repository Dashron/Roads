var roads = require('../../index');
var Resource = roads.Resource;
var Response = roads.Response;

var Posts = require('../mock_db/posts');

/**
 * [one description]
 * @type {Resource}
 */
module.exports.one = new Resource({
	methods : {
		GET : function* (url, body, headers) {
			if (!url.args.post_id) {
				return new Response(this.representations.server.notFound(url.pathname, 'post'), 404);
			}

			var post = yield Posts.get('id=' + url.args.post_id);

			if (!post) {
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
			return new Response(this.representations.collection(yield Posts.get('all'), this.representations.post));
		}
	}
});