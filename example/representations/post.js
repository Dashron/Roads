"use strict";

var userRepresentation = require('./user');

module.exports = require('bluebird').coroutine(function* (post) {
	var representation = {};

	representation.name = post.title;
	representation.description = post.body;
	representation.user = function () {
		return user_representation(user);
	};

	return representation;
});