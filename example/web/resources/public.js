"use strict";
/**
* private.js
* Copyright(c) 2016 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

var roads = require('../../../index');
var Resource = roads.Resource;


module.exports = new Resource({
	methods: {
		GET: function () {
			this.setTitle('Public Resource');
			return new this.Response('Hello!<br /> The page you are looking at can be renderd via server or client. The landing page can too, so try going back <a href="/" data-roads="link">home</a>!<br />');
		}
	}
});