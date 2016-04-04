"use strict";
/**
* setTitle.js
* Copyright(c) 2016 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

/**
 * Adds two simple functions to get and set a page title on the request context. This is very helpful for isomorphic js, since on the client, page titles aren't part of the rendered view data.
 */
module.exports = function (method, url, body, headers, next) {
	this._page_title = null;

	this.setTitle = (title) => {
		this._page_title = title;
	};

	return next();
};