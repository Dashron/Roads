/*
* gfw.js - model.js
* Copyright(c) 2011 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
*/
"use strict";
var mysql_module = require('db-mysql');
var connections = {};

module.exports.loadConnection = function (label, config) {
	connections[label] = null;

	new mysql_module.Database(config).connect(function(error) {
		if (error) {
			// We don't allow startup if we can not connect to all of the databases
			throw error;
		}

		connections[label] = this;

		for(var i in connections) {
			if (connections[i] === null) {
				return;
			}
		}

		// call ready if we have a connection loaded for each label requested
		module.exports._ready();
	});
};

module.exports._ready = function () {
	module.exports.ready = function (fn) {
		fn();
	}
}


module.exports.ready = function (fn) {
	module.exports._ready = fn;
};

module.exports.getConnection = function (label) {
	if (typeof connections[label] == "object") {
		return connections[label];
	}
};
