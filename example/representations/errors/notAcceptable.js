var Promise = require('bluebird');

module.exports = Promise.coroutine(function (error) {
	var representation = {};

	representation.error = error.message;
	representation.code = 406;

	this.status = 406;
	return representation;
});