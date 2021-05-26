/**
 * client.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This file is an example of using roads router in the client
 */

import { Road, RoadsPJAX, ParseBodyMiddleware, SimpleRouterMiddleware, CookieMiddleware } from 'roads';
import applyPublicRotues from './routes/applyPublicRoutes';
import emptyTo404 from './middleware/emptyTo404';

const road = new Road();

road.use(function (method, url, body, headers, next) {
	console.log(`fake ${  method  } request to...`, url);
	return next();
});

const pjax = new RoadsPJAX(road, document.getElementById('container') as HTMLAnchorElement, window);
pjax.addTitleMiddleware();
road.use(emptyTo404);
road.use(ParseBodyMiddleware.parseBodyMiddleware);
// Todo: get this set up properly, then check cokie and stor val on the server
road.use(CookieMiddleware.clientCookieMiddleware(document));
pjax.register();
pjax.registerAdditionalElement(document.getElementById('home') as HTMLAnchorElement);
const router = new SimpleRouterMiddleware.SimpleRouter(road);
applyPublicRotues(router);