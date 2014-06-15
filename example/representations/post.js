var Promise = require('bluebird');
var user_representation = require('./user');

module.exports = Promise.coroutine(function* (post) {
	var representation = {};

	representation.name = post.title;
	representation.description = post.body;
	representation.user = Promise.coroutine(function* () {
		return yield user_representation(user);
	});

	return representation;
});