"use strict";
/**
* collection.js
* Copyright(c) 2017 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

module.exports = function (array, representation) {
	var response = {
		total : array.length,
		collection : []
	};

	for (var i = 0; i < array.length; i++) {
		response.collection.push(array[i]);
	}

	return response;
};