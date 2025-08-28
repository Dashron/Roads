/**
 * server.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This file starts up the HTTP roads server
 */

import { Road, Response, CookieMiddleware, RouterMiddleware, attachCommonMiddleware } from 'roads';

import express from 'express';
import addLayout from './middleware/addLayout.js';
import applyPublicRoutes from './routes/applyPublicRoutes.js';
import applyPrivateRoutes from './routes/applyPrivateRoutes.js';
import emptyTo404 from './middleware/emptyTo404.js';
import { expressConnector } from './middleware/expressConnector.js';
import bodyParser from 'body-parser';

const road = new Road();

road.use(function (method, url, body, headers, next) {
	console.log(`${method} ${url}`);
	return next();
});

attachCommonMiddleware(road);
road.use(CookieMiddleware.serverMiddleware);
road.use(addLayout);

const router = new RouterMiddleware.Router(road);
applyPublicRoutes(router);
applyPrivateRoutes(router);
road.use(emptyTo404);

const app = express();

app.use(bodyParser.json());
app.set('etag', false);
app.use(express.raw({ type: '*/*' }));
app.use(expressConnector(road));

app.listen(8081, 'localhost', function () {
	console.log('server has started');
});