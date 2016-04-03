"use strict";
/**
* build.js
* Copyright(c) 2016 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

require('../../index.js').build(__dirname + '/static/client.js', __dirname + '/static/client.brws.js', {
	use_sourcemaps: true,
	roads: {
		output_file: './static/roads.brws.js',
	}
});