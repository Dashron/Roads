"use strict";
var util_module = require('util');
var event_module = require('events');
var qs_module = require('querystring');
var url_module = require('url');

/**
 * [parsePostData description]
 * @param  {String} body         [description]
 * @param  {String} content_type [description]
 * @return {Object}
 */
exports.parsePostData = function (body, content_type) {
	content_type = content_type.split(';');

	switch (content_type[0].trim()) {
		case "application/x-www-form-urlencoded":
			return qs_module.parse(body);
			break;
		case "application/json":
			return JSON.parse(boddy);
			break;
		default:
			console.log(body);
			console.log(content_type);
			throw new Error("content type not supported");
	}
};

/**
 * [Request description]
 * @param {Request} original_request [description]
 * @todo  rewrite
 */
var Request = exports.Request = function Request (original_request) {
	var _self = this;

	_self.request(original_request);
	var buffer = [];
	_self.GET = _self.url('query');

	_self.request().on('data', function (data) {
		buffer.push(data);
	});

	_self.request().on('end', function () {
		if (_self.method === "POST") {
			_self.POST = exports.parsePostData(buffer.join(), _self.contentType());
		}

		_self.emit('end');
	});

	this.contentType = this.headers('content-type');
	this.method = this.request().method;
	this.etag = this.headers('if-none-match');
};

util_module.inherits(Request, event_module.EventEmitter);

/**
 * [contentType description]
 * @type {String}
 */
Request.prototype.contentType = null;

/**
 * [etag description]
 * @type {[type]}
 */
Request.prototype.etag = null;

/**
 * [method description]
 * @type {String}
 */
Request.prototype.method = null;

/**
 * [request description]
 * @param  {Request} request [description]
 * @return {Request}
 */
Request.prototype.request = function (request) {
	if (typeof request !== "undefined") {
		this._request = request;
	}

	return this._request;
};

/**
 * [headers description]
 * @param  {String} key [description]
 * @return {String}
 */
Request.prototype.headers = function (key) {
	return this.request().headers[key];
};

/**
 * [url description]
 * @param  {String} key [description]
 * @return {Object | String}
 */
Request.prototype.url = function (key) {
	if (typeof this._url === "undefined") {
		this._url = url_module.parse(this.request().url, true);
	}

	if (typeof key === "undefined") {
		return this.request().url;
	}

	return this._url[key];
};

/**
 * [modifiedSince description]
 * @param  {Date} file_date [description]
 * @return {Bool}
 */
Request.prototype.modifiedSince = function (file_date) {
	var request_date = this.headers('if-modified-since');
	if (typeof request_date === "undefined") {
		return true;
	} else {
		request_date = new Date(request_date);
	}

	return (file_date.getTime() > request_date.getTime());
};