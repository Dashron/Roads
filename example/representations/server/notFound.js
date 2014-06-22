module.exports = require('bluebird').coroutine(function* (error) {
	return {
		error : 'There is no resource located at ' + error.message,
		code : 404
	};
});