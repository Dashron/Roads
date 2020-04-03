"use strict";
/**
 * build.js
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This file build the client side javascript for in browser rendering
 */

require('roads').build(__dirname + '/static/client.js', __dirname + '/static/client.brws.js', {
	use_sourcemaps: true,
	transform: ["brfs"]
});