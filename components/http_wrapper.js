"use strict";
var util_module = require('util');
var event_module = require('events');
var qs_module = require('querystring');
var url_module = require('url');

/**
 * 
 * @param {String}
 *            data
 * @param {String}
 *            contentType
 * @return {Boolean}
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
 * 
 * @todo extend original? this is odd, I don't really like wrapping every
 *       function
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
		if (_self.method() === "POST") {
			_self.POST = exports.parsePostData(buffer.join(), _self.contentType());
		}

		_self.emit('end');
	});
};

util_module.inherits(Request, event_module.EventEmitter);

/**
 * 
 * @param {Request}
 *            request
 * @return {Cookie}
 */
Request.prototype.request = function (request) {
	if (typeof request !== "undefined") {
		this._request = request;
	}

	return this._request;
};

/**
 * 
 * @return {String}
 */
Request.prototype.contentType = function () {
	return this.headers('content-type');
};

/**
 * 
 * @param key
 * @return {String}
 */
Request.prototype.headers = function (key) {
	return this.request().headers[key];
};

/**
 * 
 * @return {String}
 */
Request.prototype.method = function () {
	return this.request().method;
};

/**
 * 
 * @param key
 * @return {Object|String}
 */
Request.prototype.url = function (key) {
	if (typeof this._url === "undefined") {
		this._url = url_module.parse(this.request().url, true);
	}

	if (typeof key === "undefined") {
		return this._url;
	}

	return this._url[key];
};

/**
 * 
 * @param {Array}
 *            matches
 * @return {Array}
 */
Request.prototype.routeMatches = function (matches) {
	if (typeof matches !== "undefined") {
		this._matches = matches;
	}

	return this._matches;
};

/**
 * 
 * @todo extend original? this is odd, I don't really like wrapping every function
 */
var Response = exports.Response = function Response (original_response) {
	this.response(original_response);
};

/**
 * 
 * @param {Response} response
 * @return {Response}
 */
Response.prototype.response = function (response) {
	if (typeof response !== "undefined") {
		this._response = response;
	}
	
	return this._response;
};

/**
 * 
 * @param {Cookie} cookie
 * @return {Cookie}
 */
Response.prototype.cookie = function (cookie) {
	if (typeof cookie !== "undefined") {
		this._cookie = cookie;
	}
	
	return this._cookie;
};

/**
 * 
 * @param {Logger} logger
 * @return {Logger}
 */
Response.prototype.logger = function (logger) {
	if (typeof logger !== "undefined") {
		this._logger = logger;
	}
	
	return this._logger;
};

/**
 * 
 * @param key
 * @param value
 */
Response.prototype.setHeader = function (key, value) {
	this.response().setHeader(key, value);
};

/**
 * 
 * @param data
 */
Response.prototype.end = function (data) {
	this.response().end(data);
};

/**
 * 
 * @param status
 * @param headers
 */
Response.prototype.writeHead = function (status, headers) {
	this.response().writeHead(status, headers);
};

/**
 * @param data
 */
Response.prototype.write = function (data) {
	this.response().write(data);
};