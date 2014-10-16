"use strict";

var userRepresentation = require('./user');

module.exports = function (post) {
	var representation = {};

	representation.uri = '/posts/' + post.id;
	representation.name = post.title;
	representation.description = post.body;
	representation.user = userRepresentation(post.user);

	return representation;
};