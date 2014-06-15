var Promise = require('bluebird');

module.exports = Promise.coroutine(function* (pathname) {
	return {
		error : 'There is no resource located at ' + pathname,
		code : 404
	};
});