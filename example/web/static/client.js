"use strict";
/**
* client.js
* Copyright(c) 2016 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

var roads = require('../../../index.js');
var road = new roads.Road(require('../resources/root').root);

var pjax = new roads.PJAX(road, document.getElementById('container'), window);
pjax.addTitleMiddleware();
pjax.addCookieMiddleware(document);
pjax.register();

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