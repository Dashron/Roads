"use strict";
/**
* private.js
* Copyright(c) 2016 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

var roads = require('../../../index');
var Resource = roads.Resource;


module.exports.test = new Resource({
	methods: {
		GET: function () {
			this.setTitle('Private Resource');
			var response = new this.Response('This is a private resource. It\'s available to the server, but is not build in the client! The landing page can be rendered via the client though, so try going back <a href="/" data-roads="link">home</a>!<br />');
			response.setCookie('private_cookie', 'foo');
			response.setCookie('public_cookie', 'bar', {
				httpOnly: false
			});
			return response;
		}
	}
});

module.exports.root = new Resource({
	resources: {
		"private" : module.exports.test
	}
});
