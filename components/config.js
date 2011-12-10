/*
* gfw.js - config.js
* Copyright(c) 2011 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
*/

"use strict";
var _config_data = {};

/**
 * @param {Object} data
 */
var Config = exports.Config = function(data) {
	_config_data = data;
};

/**
 * 
 * @param {String} key
 * @return {Mixed}
 */
Config.prototype.get = function(key) {
	return _config_data[key];
};

/**
 * 
 * @param {String} key
 * @param {Mixed} value
 */
Config.prototype.set = function(key, value) {
	_config_data[key] = value;
};