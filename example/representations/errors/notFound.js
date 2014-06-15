var Promise = require('bluebird');

module.exports = Promise.coroutine(function (url) {
	var representation = {};

	representation.error = 'There is no resource located at ' + url;
	representation.code = 404;

	this.status = 404;
	return representation;
});