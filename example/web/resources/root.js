"use strict";
/**
* root.js
* Copyright(c) 2016 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

var roads = require('../../../index');
var Resource = roads.Resource;
var load_file = require('./load_file.js');
var public_route = require('./public.js');
/**
 * [one description]
 * @type {Resource}
 */
module.exports.root = new Resource({
	resources: {
		// Ideally you would use static roads, koa or express middleware to handle these so you don't keep
		// having to add more
		'client.brws.js': load_file,
		'client.map.json': load_file,
		'public': public_route
	},
	methods : {
		GET : function (url, body, headers) {
			// In the real world the body of the response should be created from a template engine.
			return new this.Response('<!DOCTYPE html>\
<html>\
<body>\
	<div id="container"> \
		<script src="/client.brws.js"></script>\
		Hello!<br />\
		Try the <a href="/public" data-roads="link">private test link</a>. It\'s available to the server and can be rendered from the client! Try clicking it for the client path, or control clicking for the server.<br />\
		Try the <a href="/private">private test link</a>. It\'s available to the server, but is not build in the client! Check your console for proof of the 404!\
	</div>\
</body>\
</html>');
		}
	}
});