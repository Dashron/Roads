"use strict";
/**
* post.js
* Copyright(c) 2016 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

var userRepresentation = require('./user');

module.exports = function (post) {
	var representation = {};

	representation.uri = '/posts/' + post.id;
	representation.name = post.title;
	representation.description = post.body;
	representation.user = userRepresentation(post.user);

	return representation;
};