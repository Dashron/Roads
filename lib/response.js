"strict mode";

/**
* response.js
* Copyright(c) 2014 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

var Promise = require('bluebird');

var Response = exports.Response = function Response (data) {
	console.log('data');
	console.log(data);
	this.data = data;
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
 * [getData description]
 * @return {[type]} [description]
 */
Response.prototype.getData = function () {
	//var fields = field_filter.expandFields(url.query.fields.split(','));
	//return field_filter.filterObject(fields, response);
	
	return this.data;
}

/**
 * [write description]
 * @param  {[type]} response [description]
 * @return {[type]}          [description]
 */
Response.prototype.writeTo = function (http_response) {
	var data = this.getData();
	http_response.write(JSON.stringify(data));

	if (!this.status) {
		this.status = 200;
	}

	http_response.writeHead(this.status, this.headers);
};