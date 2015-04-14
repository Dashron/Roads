"use strict";

module.exports = function (error) {
	return {
		error : 'There is no resource located at ' + error.message,
		code : 404
	};
};