/*
* gfw.js - database.js
* Copyright(c) 2011 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
*/
"use strict";
var mysql_module = require('mysql');
var connections = {};

module.exports.connect = function (config)
{
	var promise = new module.exports.ConnectionPromise();
	var key = null;
	var in_progress = {};

	for (key in config) {
		in_progress[key] = true;
		connections[key] = new module.exports.Database(key, config[key]);
		connections[key].on('error', function (err) {
			if (!err.fatal) {
				promise._warning(err);
				return;
			}

		    if (err.code !== 'PROTOCOL_CONNECTION_LOST') {
		      promise._error(err);
		    }

		    //todo reconnect
			console.log(err);
		});
		connections[key].connect(function (err) {
			if (err) {
				promise._error(err);
			} else {
				delete in_progress[key];
				if (!in_progress.length) {
					promise._ready();
				}
			}
		});
	}

	return promise;
}

var ConnectionPromise = module.exports.ConnectionPromise = function () {
	this.warnings = [];
};

ConnectionPromise.prototype._warnings = null;

ConnectionPromise.prototype._ready = function (data) {
	this.ready = function (fn) {
		fn(data);
	};
};

ConnectionPromise.prototype._error = function (err) {
	this.error = function (fn) {
		fn(err);
	};
};

ConnectionPromise.prototype._warning = function (err) {
	this.warnings.push(err);

	this.warning = function (fn) {
		var i = 0;
		while (this.warnings.length) {
			fn(this.warnings.shift());
		}
	};
};

ConnectionPromise.prototype.ready = function (fn) {
	this._ready = fn;
};

ConnectionPromise.prototype.error = function (fn) {
	this._error = fn;
};

ConnectionPromise.prototype.warning = function (fn) {
	this._warning = fn;
};

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
		if (typeof config !== "object") {
			throw new Error('You must provide a connection config the first time you create a database');
		}

		connections[label] = mysql_module.createConnection(config);
	}

	return connections[label];
};