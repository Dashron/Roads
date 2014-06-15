var Promise = require('bluebird');

module.exports = Promise.coroutine(function (methods) {
	return methods;
});