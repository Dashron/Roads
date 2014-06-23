"use strict";

module.exports = require('bluebird').coroutine(function* (user) {
	var representation = {};

	representation.uri = '/users/' + user.id;
	representation.name = user.name;
	representation.url = 'http://dashron.com/users/' + user.id;
	representation.email = user.email;

	return representation;
});