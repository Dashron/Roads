"use strict";

var Promise = require('bluebird');

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