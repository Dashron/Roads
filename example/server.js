"use strict";
/**
 * server.js
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 * 
 * This file starts up the HTTP roads server
 */

var roads = require(__dirname + '/../src/index.js');
var road = new roads.Road();
var Server = require('roads-server').Server;

road.use(function (method, url, body, headers, next) {
	console.log(method + ' ' + url);
	return next();
});

road.use(roads.middleware.killSlash);
road.use(roads.middleware.cookie());
road.use(require('./middleware/addLayout.js'));
road.use(roads.middleware.setTitle);
let router = new roads.middleware.SimpleRouter(road)
require('./routes/applyPublicRoutes.js')(router);
require('./routes/applyPrivateRoutes.js')(router);
road.use(require('./middleware/emptyTo404.js'));

var server = new Server(road, function (err) {
	console.log(err.stack);
	return new roads.Response('Unknown Error', 500);
});

server.listen(8081, function () {
	console.log('server has started');
});
