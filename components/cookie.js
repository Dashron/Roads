/*
* gfw.js - config.js
* Copyright(c) 2011 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
*/

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
 * @todo: better expires date checking
 */
var Cookie = exports.Cookie = function (request, response) {
	this.response = response;
	this.cookie_data = {};
	this.set_data = {};
	
	if (typeof request.headers.cookie === "string") {
		var cookies = request.headers.cookie.split(';');
		var cookie = [];
		var i = 0;

		for (i = 0; i < cookies.length; i++) {
			cookie = cookies[i].split('=');

			this.cookie_data[cookie[0]] = cookie[1];
		}
	}
};

/**
 * 
 * @param domain
 */
Cookie.prototype.setDomain = function (domain) {
	this.domain = domain;
};

/**
 * @type {String}
 */
Cookie.prototype.domain = null;

/**
 * @type {HttpResponse}
 */
Cookie.prototype.response = null;

/**
 * 
 * @type {Object}
 */
Cookie.prototype.cookie_data = null;

/**
 * 
 */
Cookie.prototype.set_data = null;

/**
 * 
 * @param {String}
 *            key
 * @return {Mixed}
 */
Cookie.prototype.get = function (key) {
	return this.cookie_data[key];
};

/**
 * 
 * @param parts
 * @param domain
 */
Cookie.prototype.apply_domain = function (parts, domain) {
	if (typeof domain === "string") {
		parts.push('Domain=' + domain);
	} else {
		parts.push('Domain=' + this.domain);
	}
};

/**
 * 
 * @param parts
 * @param path
 */
Cookie.prototype.apply_path = function (parts, path) {
	if (typeof path === "string") {
		parts.push('Path=' + path);
	} else {
		parts.push('Path=/');
	}
};

/**
 * 
 * @param parts
 * @param expires
 */
Cookie.prototype.apply_expires = function (parts, expires) {
	if (typeof expires === "string") {
		// Session should not include expires
		if (expires.toLowerCase() !== "session") {
			// TODO: date checking
			parts.push('Expires=' + expires);
		}
	} else if (typeof expires !== "undefined") {
		// If a date is provided convert it
		// TODO: better date type checking
		parts.push('Expires=' + expires.toString());
	}
};

/**
 * 
 * @param {String}
 *            key
 * @param {Object}
 *            options
 * @param {String}
 *            options.value the cookie's value
 * @param {String}
 *            options.domain the domain that can access the cookie
 * @param {String}
 *            options.path the path within the domain that can access the cookie
 * @param {Date|String}
 *            options.expires the date that the cookie expires, provide
 *            "session" for it to expire when the browser closes
 * @param {Boolean}
 *            options.secure https only
 * @param {Boolean}
 *            options.HttpOnly server only, no javascript access
 * @return void
 */
Cookie.prototype.set = function (key, options) {
	this.set_data[key] = options;
	var i = 0;
	var cookie_header = [];

	// set all of the header data when you call set.
	// we don't want to make the users re-call stuff, and I don't want to mess with the response prototype when it's this easy.
	for (i in this.set_data) {
		cookie_header.push(this.buildCookie(i, this.set_data[i]));
	}
	
	this.response.setHeader('Set-Cookie', cookie_header);
};

/**
 * 
 * @param {String} key
 * @param {Object} options
 * @return {String}
 */
Cookie.prototype.buildCookie = function (key, options) {
	var parts = [];
	
	parts.push(key + '=' + options.value);
	this.apply_domain(parts, options.domain);
	this.apply_path(parts, options.path);
	this.apply_expires(parts, options.expires);

	if (options.secure) {
		parts.push('Secure');
	}

	if (options.http_only) {
		parts.push('HttpOnly');
	}

	return parts.join('; ');
};