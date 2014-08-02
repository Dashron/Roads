module.exports = require('bluebird').coroutine(function* (error) {
	return {
		allow : error.message,
		code : 405
	};
});