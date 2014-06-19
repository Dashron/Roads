var user_representation = require('./user');

module.exports = function* (post) {
	var representation = {};

	representation.name = post.title;
	representation.description = post.body;
	representation.user = function () {
		return user_representation(user);
	};

	return representation;
};