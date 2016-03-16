"use strict";
/**
* root.js
* Copyright(c) 2016 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

var roads = require('../../../index');
var Resource = roads.Resource;
var loadFile = require('./loadFile');

/**
 * [one description]
 * @type {Resource}
 */
module.exports.root = new Resource({
	resources: {
		// Ideally you would use static roads, koa or express middleware to handle these so you don't keep
		// having to add more
		'client.brws.js': loadFile,
		'client.map.json': loadFile
	},
	methods : {
		GET : function (url, body, headers) {
			// In the real world the body of the response should be created from a template engine.
			return new this.Response('<!DOCTYPE html>\
<html>\
<body>\
<script src="/client.brws.js"></script>\
Hello!<br />\
Try the <a href="/test">test link</a>. It\'s available to the server, but is not build in the client! Check your console for proof of the 404!\
</body>\
</html>');
		}
	}
});