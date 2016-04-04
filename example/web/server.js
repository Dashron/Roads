"use strict";
/**
* server.js
* Copyright(c) 2016 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

var roads = require(__dirname + '/../../index');
var road = new roads.Road([require('./resources/root').root, require('./resources/private').root]);

road.use(roads.middleware.killSlash);
road.use(require('./middleware/addLayout.js'));
road.use(roads.middleware.setTitle);

var server = new roads.Server(road, function (err) {
	console.log(err.stack);
	
	switch (err.code) {
		case 404:
			return new roads.Response('Not Found', 404);
		case 405:
			return new roads.Response('Not Allowed', 405);
		default:
		case 500:
			return new roads.Response('Unknown Error', 500);
	}
});

server.listen(8081, function () {
	console.log('server has started');
});
