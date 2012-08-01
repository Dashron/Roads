/*
* gfw.js - cookie.js
* Copyright(c) 2011 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
*/
"use strict";

/*
 * How to:
 * Create a cookie with the http request and response.
 * To retrieve a cookie, use cookie.get(key);
 * To set a cookie, use cookie.set(key, options);
 * where options are...
 * 
 * value : the cookie's value
 * domain : the domain that can access the cookie
 * path : the path within the domain that can access the cookie
 * expires : the date that the cookie expires, provide "session" for it to expire when the browser closes
 * secure : if true, the cookie is only provided when using https
 * HttpOnly : if true, javascript will not be able to access the cookie
 * 
 * http://tools.ietf.org/html/rfc6265
 * 
 * @todo: better expires date checking
 */
var Cookie = exports.Cookie = function (request, response) {
	this._response = response;
	this._cookie_data = {};
	this._header_data = {};
	
	if (typeof request.headers.cookie === "string") {
		var cookies = request.headers.cookie.split(';');
		var cookie = [];
		var i = 0;

		for (i = 0; i < cookies.length; i++) {
			cookie = cookies[i].trim().split('=');

			this._cookie_data[cookie[0]] = cookie[1];
		}
	}
};

Cookie.prototype._domain = null;
Cookie.prototype._response = null;
Cookie.prototype._cookie_data = null;
Cookie.prototype._header_data = null;

/**
 * 
 * @param {string} domain
 */
Cookie.prototype.setDomain = function (domain) {
	this._domain = domain;
};

/**
 * Retrieves the value of a cookie for the provided key
 * 
 * @param {string} key
 * @return {mixed} the cookie value
 */
Cookie.prototype.get = function (key) {
	return this._cookie_data[key];
};

/**
 * 
 * @param {String} key
 * @param {Object} options
 * @param {String} options.value the cookie's value
 * @param {String} options.domain the domain that can access the cookie
 * @param {String} options.path the path within the domain that can access the cookie
 * @param {Date|String} options.expires the date that the cookie expires, provide "session" for it to expire when the browser closes
 * @param {Boolean} options.secure https only
 * @param {Boolean} options.HttpOnly server only, no javascript access
 * @return void
 */
Cookie.prototype.set = function (key, options) {
	this._header_data[key] = options;
	this._cookie_data[key] = options.value;
	var i = 0;
	var cookie_header = [];

	// set all of the header data when you call set.
	// we don't want to make the users re-call stuff, and I don't want to mess with the response prototype when it's this easy.
	for (i in this._header_data) {
		cookie_header.push(this._buildCookie(i, this._header_data[i]));
	}
	
	this._response.setHeader('Set-Cookie', cookie_header);
};

/**
 * Removes a cookie
 * 
 * @param  {String} key
 */
Cookie.prototype.delete = function (key) {
	this.set(key, {
		expires : new Date(0)
	});
};

/**
 * Helper function to push cookie data on to an array of cookie data.
 * 
 * @param  {Array} parts
 * @param  {String|Number} key           [description]
 * @param  {Mixed} value         [description]
 * @param  {Mixed} default_value
 * @return {Array}
 */
var apply_part = function (parts, key, value, default_value) {
	if (typeof value === "undefined" || value === null) {
		value = default_value;
		if (typeof value === "undefined" || value === null) {
			return false;
		}
	}

	parts.push(key + '=' + value);
	return true;
};

/**
 * 
 * @param {String} key
 * @param {Object} options
 * @param {String} options.value the cookie's value
 * @param {String} options.domain the domain that can access the cookie
 * @param {String} options.path the path within the domain that can access the cookie
 * @param {Date|String} options.expires the date that the cookie expires, provide "session" for it to expire when the browser closes
 * @param {Boolean} options.secure https only
 * @param {Boolean} options.HttpOnly server only, no javascript access
 * @return {String}
 */
Cookie.prototype._buildCookie = function (key, options) {
	var parts = [];
	
	apply_part(parts, key, options.value, 1);
	apply_part(parts, 'Domain', options.domain, this._domain);
	apply_part(parts, 'Path', options.path, '/');
	
	if (options.expires !== "session") {
		apply_part(parts, 'Expires', options.expires);	
	}

	if (options.secure) {
		parts.push('Secure');
	}

	if (options.http_only) {
		parts.push('HttpOnly');
	}

	return parts.join('; ');
};