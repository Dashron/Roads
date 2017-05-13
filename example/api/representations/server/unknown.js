"use strict";
/**
* unknokwn.js
* Copyright(c) 2017 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

module.exports = function (error) {
	return {
		error : error.message,
		code : error.code,
		stack : error.stack.split('\n    at')
	};
};