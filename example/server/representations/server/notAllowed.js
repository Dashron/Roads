"use strict";

module.exports = function (error) {
	return {
		allow : error.message,
		code : 405
	};
};