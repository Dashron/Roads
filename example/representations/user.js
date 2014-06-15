var Promise = require('bluebird');

module.exports = Promise.coroutine(function (user) {
	var representation = {};

	representation.uri = '/users/' + user.id;
	representation.name = user.name;
	representation.url = 'http://dashron.com/users/' + user.id;
	representation.email = user.email;

	return representation;
});