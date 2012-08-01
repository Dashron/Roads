/*
* gfw.js - database.js
* Copyright(c) 2011 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
*/
"use strict";
var mysql_module = require('mysql');
var connections = {};

/**
 * Returns the connection for the provided label.
 * If no connection has been created, this attempts to create the connection using the provided config.
 * 
 * @param  {String} label
 * @param  {Object} config
 * @return {Connection}
 */
module.exports.Database = function (label, config) {
	if (typeof connections[label] === "undefined" || connections[label] === null) {
		if (typeof config != "object") {
			throw new Error('You must provide a connection config the first time you create a database');
		}

		connections[label] = mysql_module.createConnection(config);
	}

	return connections[label];
};