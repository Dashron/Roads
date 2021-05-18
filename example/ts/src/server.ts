/**
 * server.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This file starts up the HTTP roads server
 */

import { Road, Response, killSlashMiddleware, cookieMiddleware,
	storeValsMiddleware, parseBodyMiddleware, SimpleRouter } from 'roads';

import { Server } from 'roads-server';
import addLayout from './middleware/addLayout';
import applyPublicRotues from './routes/applyPublicRoutes';
import applyPrivateRoutes from './routes/applyPrivateRoutes';
import emptyTo404 from './middleware/emptyTo404';
import { Middleware, Context } from 'roads/types/core/road';

const road = new Road();

road.use(function (method, url, body, headers, next) {
	console.log(`${method} ${url}`);
	return next();
} as Middleware<Context>);

road.use(killSlashMiddleware);
road.use(cookieMiddleware);
road.use(addLayout);
road.use(storeValsMiddleware);
road.use(parseBodyMiddleware);

const router = new SimpleRouter(road);
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