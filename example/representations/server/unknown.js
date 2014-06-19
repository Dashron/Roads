module.exports = function* (error) {
	return {
		error : error.message,
		code : error.code,
		stack : error.stack.split('\n    at')
	};
};