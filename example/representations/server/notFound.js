module.exports = function* (pathname) {
	return {
		error : 'There is no resource located at ' + pathname,
		code : 404
	};
};