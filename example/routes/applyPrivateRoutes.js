"use strict";
/**
 * applyPrivateRoutes.js
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 * 
 * This file is an example of how to assign some private routes to a road server
 */

var fs = require('fs');

 /**
  * Before calling this function you should create your roads object and bind a SimpleRouter to that road.
  * You then pass the road to this function to assign a collection of example routes that should only
  * be rendered on the server. 
  * 
  * @param {SimpleRouter} router - The router that the routes will be added to
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

	router.addRoute('GET', '/privateJSON', function () {
		return new this.Response(JSON.stringify({"private-success": true}));
	});

	router.addRoute('GET', 'client.brws.js', function (url, body, headers) {
		this.ignore_layout = true;
		// In the real world the body of the response should be created from a template engine.
		return new this.Response(fs.readFileSync(__dirname + '/../static/client.brws.js').toString('utf-8'), 200, {
			'Content-Type': 'application/json; charset=UTF-8'
		});
	});

	router.addRoute('GET', 'client.map.json', function (url, body, headers) {
		// In the real world the body of the response should be created from a template engine.
		return new this.Response(fs.readFileSync(__dirname + '/../static/client.map.json').toString('utf-8'), 200, {
			'Content-Type': 'application/json; charset=UTF-8'
		});
	});
};