"use strict";
/**
* notAllowed.js
* Copyright(c) 2016 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

module.exports = function (error) {
	return {
		allow : error.message,
		code : 405
	};
};