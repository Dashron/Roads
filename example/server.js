"use strict";
/**
 * server.js
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 * 
 * This file starts up the HTTP roads server
 */

var road = new (require('roads/road.js').default)();
var Server = require('roads-server').Server;

road.use(function (method, url, body, headers, next) {
	console.log(method + ' ' + url);
	return next();
});

road.use(require('roads/middleware/killSlash.js'));
road.use(require('roads/middleware/cookie').default());
road.use(require('./middleware/addLayout.js'));
road.use(require('roads/middleware/setTitle.js'));
let router = new (require('roads/middleware/simpleRouter.js').default)(road);
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