/*
* gfw.js - database.js
* Copyright(c) 2011 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
*/
"use strict";
var mysql_module = require('mysql');
var connections = {};
var configs = {};

module.exports.loadConnection = function (label, config) {
	connections[label] = null;
	configs[label] = config;

	connections[label] = mysql_module.createConnection(configs[label]);
	connections[label].connect();
};

/**
 * 
 * @todo  connection pooling
 * @param  {[type]} label [description]
 * @return {[type]}       [description]
 */
module.exports.getConnection = function (label) {
	if (typeof connections[label] == "object") {
		return connections[label];
	}
};
