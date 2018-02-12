"use strict";
/**
 * server.js
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 * 
 * This file starts up the HTTP roads server
 */

var roads = require(__dirname + '/../index');
var road = new roads.Road();
var Server = require('roads-server').Server;

road.use(roads.middleware.killSlash);
road.use(roads.middleware.cookie());
road.use(require('./middleware/addLayout.js'));
road.use(roads.middleware.setTitle);
let router = new roads.middleware.SimpleRouter(road)
require('./routes/applyPublicRoutes.js')(router);
require('./routes/applyPrivateRoutes.js')(router);

var server = new Server(road, function (err) {
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
