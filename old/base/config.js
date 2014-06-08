"use strict";

/**
* config.js
* Copyright(c) 2012 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

var config = {};

module.exports.get = function (key) {
	var keys = key.split('.');
	var config_val = config;
	var config_key = null;

	while (keys.length) {
		config_key = keys.shift();

		if (typeof config_val[config_key] !== "undefined") {
			config_val = config_val[config_key];
		} else {
			return undefined;
		}
	}

	return config_val;
};

module.exports.load = function (key, path) {
	if (typeof path === "object") {
		config[key] = path;
	} else {
		config[key] = require(path);
	}
};