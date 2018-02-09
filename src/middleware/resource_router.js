"use strict";
/**
* resource_router.js
* Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */
const ResourceRouter = require('../resource_router/resource_router.js');

/**
 * 
 */
module.exports = function (resources) {
	let router = new ResourceRouter(resources);
	return function (method, url, body, headers, next) {
		return router.route(method, url, body, headers, next);
	};
};