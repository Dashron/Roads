"strict mode";

/**
* response.js
* Copyright(c) 2014 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

var Promise = require('bluebird');

var Response = module.exports = function Response (data, status, headers) {
	this.data = data;
	this.status = status || 200;
	this.headers = headers || {};
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
Response.prototype.getData = Promise.coroutine(function* () {
	//var fields = field_filter.expandFields(url.query.fields.split(','));
	//return field_filter.filterObject(fields, response);

	return this.expandData(yield this.data);
});

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

/**
 * [expandData description]
 * @type {[type]}
 */
Response.prototype.expandData = Promise.coroutine(function* (data) {
	for (var key in data) {
		if (!data.hasOwnProperty(key)) {
			continue;
		}

		if (typeof(data[key]) === "function") {
			data[key] = yield data[key]();
		} else if (typeof(data[key]) === "object") {
			data[key] = yield this.expandData(data[key]);
		}
	}

	return data;
});