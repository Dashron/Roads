"strict mode";

/**
* response.js
* Copyright(c) 2014 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

var Promise = require('bluebird');
var Filter = require('./response_filter');

var Response = module.exports = function Response (data, status, headers) {
	this.data = data;
	this.status = status || 200;
	this.headers = headers || {};

	if (!this.headers['content-type']) {
		this.headers['content-type'] = 'application/json';
	}
};

/**
 * Holds all response information
 * @type Object
 */
Response.prototype.data = null;

/**
 * All response headers
 * @type {[type]}
 */
Response.prototype.headers = null;

/**
 * The HTTP Status code
 * @type number
 */
Response.prototype.status = null;

/**
 * [fields description]
 * @type {Boolean}
 */
Response.prototype._fields = false;

/**
 * [getData description]
 * @return {[type]} [description]
 */
Response.prototype.getData = function () {
	var _self = this;
	var promise = null;

	if (this.data instanceof Promise) {
		promise = this.data;
	} else {
		promise = new Promise(function (resolve, reject) {
			resolve(_self.data);
		});
	}

	return promise.then(function (representation_data) {
		// no reason to filter if fields is at it's original value
		if (_self._fields) {
			return Filter.filter(_self._fields, representation_data);
		} else {
			return representation_data;
		}
	});
};

/**
 * Load the fields whitelist for the final representation
 * 
 * @param  {[type]} fields [description]
 * @return {[type]}        [description]
 */
Response.prototype.filter = function (fields) {
	this._fields = fields;
	return this;
};

/**
 * [write description]
 * @param  {[type]} response [description]
 * @return {[type]}          [description]
 */
Response.prototype.writeTo = function(http_response, end) {
	var response = this;

	return this.getData()
		.then(function (data) {

			http_response.writeHead(response.status, response.headers);
			http_response.write(JSON.stringify(data));

			if (end !== false) {
				http_response.end();
			}
		});
};