"use strict";
/**
* server.js
* Copyright(c) 2012 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

var init = require('./init');

init.config();
init.bifocals();

init.db().ready(function () {
	console.log('successfully connected to all databases');

	init.webserver().start(function () {
		var address = this.address();
		console.log('listening on ' + address.address + ':' + address.port);
	});
});