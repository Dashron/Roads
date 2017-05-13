"use strict";
/**
* user.js
* Copyright(c) 2017 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

module.exports = function (user) {
	var representation = {};

	representation.uri = '/users/' + user.id;
	representation.name = user.name;
	representation.url = 'http://dashron.com/users/' + user.id;
	representation.email = user.email;

	return representation;
};