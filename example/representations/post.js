"use strict";

var userRepresentation = require('./user');

module.exports = function (post) {
	var representation = {};

	representation.uri = '/posts/' + post.id;
	representation.name = post.title;
	representation.description = post.body;
	// tofix: plural posts endpoint isn't properly populating this
	representation.user = function () {
		return userRepresentation(post.user);
	};

	return representation;
};