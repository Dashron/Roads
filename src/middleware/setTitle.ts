/**
 * setTitle.js
 * Copyright(c) 2020 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 * 
 * Exposes a single middleware function to help manage the page title. This is best used alongside the PJAX helper
 */

import {Middleware} from '../road';
 
/**
 * Adds two simple functions to get and set a page title on the request context. This is very helpful for isomorphic js, since on the client, page titles aren't part of the rendered view data.
 */
let setTitle: Middleware = function (method, path, body, headers, next) {
	this._page_title = null;

	this.setTitle = (title?: string) => {
		this._page_title = title ? title : '';
	};

	return next();
};

export default setTitle;