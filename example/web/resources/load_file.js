"use strict";
/**
* load_file.js
* Copyright(c) 2016 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

var roads = require('../../../index.js');
var Resource = roads.Resource;
var fs = require('fs');

module.exports = new Resource({
	methods : {
		GET : {
			fn: function (url, body, headers) {
				// In the real world the body of the response should be created from a template engine.
				return new this.Response(fs.readFileSync(__dirname + '/../static/' + url.pathname).toString('utf-8'), 200, {
					'Content-Type': 'application/json; charset=UTF-8'
				});
			},
			ignore_layout: true
		}
	}
});