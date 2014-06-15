var Promise = require('bluebird');

module.exports = Promise.coroutine(function (error) {
	var representation = {};

	representation.error = error.message;
	representation.code = error.code;

	this.status = 500;
	return representation;
});