"use strict";
/**
* applyPrivateRoutes.js
* Copyright(c) 2017 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

var roads = require('../../../index');
var Resource = roads.Resource;

/**
 * [one description]
 * @type {Resource}
 */
module.exports = function (router) {
	router.addRoute('GET', '/private', function () {
		this.setTitle('Private Resource');
		var response = new this.Response('This is a private resource. It\'s available to the server, but is not build in the client! The landing page can be rendered via the client though, so try going back <a href="/" data-roads="link">home</a>!<br />');
		response.setCookie('private_cookie', 'foo', {
			httpOnly: true
		});
		
		response.setCookie('public_cookie', 'bar', {
			httpOnly: false
		});

		return response;
	});
};