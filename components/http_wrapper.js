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
 * @returns
 */
Request.prototype.etag = function () {
	return this.headers('If-None-Match');
};

/**
 * 
 * @param date
 * @returns
 */
Request.prototype.modifiedSince = function (file_date) {
	var request_date = this.headers('If-Modified-Since');
	return (file_date > request_date);
};

/**
 * 
 * @todo extend original? this is odd, I don't really like wrapping every
 *       function
 */
var Response = exports.Response = function Response (original_response) {
	this.response(original_response);
};

/**
 * 
 * @param {Response}
 *            response
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
 * @param {Cookie}
 *            cookie
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
 * @param {Logger}
 *            logger
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
 * @param type
 */
Response.prototype.contentType = function (type) {
	this.header('Content-Type', type);
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
 * @param key
 * @param value
 */
Response.prototype.header = function (key, value) {
	if (typeof value != "undefined") {
		this.response().setHeader(key, value);
	}

	return this.response().getHeader(key);
};

/**
 * 
 * @param date
 * @returns
 */
Response.prototype.lastModified = function (date) {
	if (typeof date != "undefined") {
		return this.header('Last-Modified', date.toString());
	}
	return this.header('Last-Modified');
};

/**
 * @param data
 */
Response.prototype.write = function (data) {
	this.response().write(data);
};

/**
 * 
 */
Response.prototype.ok = function (contents) {
	this.response().writeHead(200);
	if (typeof contents != "undefined") {
		this.response().end(contents);
	}
};

/**
 * 301 : Moved permanantly (Url has changed) 303 : See Other (Forced navigation.
 * New page is not a substitute. Not included in browser navigation history)
 * 
 * @param status
 * @param url
 */
Response.prototype.redirect = function (url, status) {
	this.response().writeHead(status, {
		'Location' : url
	});
	this.end();
};

/**
 * 
 */
Response.prototype.notModified = function () {
	this.response().writeHead(304);
	this.end();
};

/**
 * 
 */
Response.prototype.unauthorized = function () {
	this.response().writeHead(401);
	this.end();
};

/**
 * 
 */
Response.prototype.notFound = function () {
	this.response().writeHead(404, {
		'Content-Type' : 'text/plain'
	});
	this.end("Not Found");
};

/**
 * 
 * @param error
 */
Response.prototype.error = function (error) {
	this.response().writeHead(500, {
		'Content-Type' : 'text/plain'
	});
	console.log(error);
	this.end();
};

/**
 * expires - a date at which the cache will expire max-age=[seconds] - specifies
 * the maximum amount of time that an object will be considered fresh. Similar
 * to Expires, this directive allows more flexibility. [seconds] is the number
 * of seconds from the time of the request you wish the object to be fresh for.
 * s-maxage=[seconds] - similar to max-age, except that it only applies to proxy
 * (shared) caches. public - marks the response as cacheable, even if it would
 * normally be uncacheable. For instance, if your pages are authenticated, the
 * public directive makes them cacheable. no-cache - forces caches (both proxy
 * and browser) to submit the request to the origin server for validation before
 * releasing a cached copy, every time. This is useful to assure that
 * authentication is respected (in combination with public), or to maintain
 * rigid object freshness, without sacrificing all of the benefits of caching.
 * must-revalidate - tells caches that they must obey any freshness information
 * you give them about an object. The HTTP allows caches to take liberties with
 * the freshness of objects; by specifying this header, you're telling the cache
 * that you want it to strictly follow your rules. proxy-revalidate - similar to
 * must-revalidate, except that it only applies to proxy caches.
 * 
 */
Response.prototype.cache = function (details) {
	var control_header = [];

	if (details['expires']) {
		this.header('Expires', details['expires'].toString());
	}

	if (details['max-age']) {
		control_header.push('max-age=' + details['max-age']);
	}

	if (details['s-maxage']) {
		control_header.push('s-maxage=' + details['s-maxage']);
	}

	if (details['public']) {
		control_header.push('public');
	}

	if (details['no-cache']) {
		control_header.push('no-cache');
	}

	if (details['must-revalidate']) {
		control_header.push('must-revalidate');
	}

	if (details['proxy-revalidate']) {
		control_header.push('proxy-revalidate');
	}

	this.header('Cache-Control', control_header.join(', '));
};