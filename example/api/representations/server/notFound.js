"use strict";
/**
* notFound.js
* Copyright(c) 2017 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

module.exports = function (error) {
	return {
		error : 'There is no resource located at ' + error.message,
		code : 404
	};
};