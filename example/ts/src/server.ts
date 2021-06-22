/**
 * server.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This file starts up the HTTP roads server
 */

import { Road, Response, RemoveTrailingSlashMiddleware, CookieMiddleware,
	StoreValsMiddleware, ParseBodyMiddleware, BasicRouterMiddleware } from 'roads';

import { Server } from 'roads-server';
import addLayout from './middleware/addLayout';
import applyPublicRotues from './routes/applyPublicRoutes';
import applyPrivateRoutes from './routes/applyPrivateRoutes';
import emptyTo404 from './middleware/emptyTo404';

const road = new Road();

road.use(function (method, url, body, headers, next) {
	console.log(`${method} ${url}`);
	return next();
});

road.use(RemoveTrailingSlashMiddleware.middleware);
road.use(CookieMiddleware.serverMiddleware);
road.use(StoreValsMiddleware.middleware);
road.use(addLayout);
road.use(ParseBodyMiddleware.middleware);

const router = new BasicRouterMiddleware.BasicRouter(road);
applyPublicRotues(router);
applyPrivateRoutes(router);
road.use(emptyTo404);

// TODO: I think we need to make this a peer dependency?
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const server = new Server(road as any, function (err: Error) {
	console.log(err.stack);
	return new Response('Unknown Error', 500);
});

server.listen(8081, 'localhost', function () {
	console.log('server has started');
});