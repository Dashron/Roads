"use strict";
/**
 * client.js
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 * 
 * This file is an example of using roads router in the client
 */

var roads = require('../../index.js');
var road = new roads.Road();

var pjax = new roads.PJAX(road, document.getElementById('container'), window);
pjax.addTitleMiddleware();
pjax.addCookieMiddleware(document);
pjax.register();
let router = new roads.middleware.SimpleRouter(road);
require('../routes/applyPublicRoutes.js')(router);

/*road.request('GET', '/')
	.then(function (response) {
		console.log(response);
	});

road.request('GET', '/test')
	.then(function (response) {
		console.log(response);
	})
	.catch(function (err) {
		console.log('[' + err.code + ']' + err.message);
		console.log(err.stack);
	});*/