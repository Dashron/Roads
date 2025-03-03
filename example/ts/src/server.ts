/**
 * server.ts
 * Copyright(c) 2025 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This file starts up the HTTP roads server
 */

import { Road, Response, RemoveTrailingSlashMiddleware, CookieMiddleware,
	StoreValsMiddleware, ParseBodyMiddleware, RouterMiddleware, attachCommonMiddleware } from 'roads';

import { Server } from 'roads-server';
import addLayout from './middleware/addLayout';
import applyPublicRotues from './routes/applyPublicRoutes';
import applyPrivateRoutes from './routes/applyPrivateRoutes';
import emptyTo404 from './middleware/emptyTo404';

const road = new Road();

road.beforeRoute(function (method, url, body, headers, next) {
	console.log(`${method} ${url}`);
	return next();
});

attachCommonMiddleware(road);
road.beforeRoute(CookieMiddleware.serverMiddleware);
road.beforeRoute(addLayout);

applyPublicRotues(road);
applyPrivateRoutes(road);
road.afterRoute(emptyTo404);

const server = new Server(road, function (err: Error) {
	console.log(err.stack);
	return new Response('Unknown Error', 500);
});

server.listen(8081, 'localhost', function () {
	console.log('server has started');
});