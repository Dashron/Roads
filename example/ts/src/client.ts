/**
 * client.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This file is an example of using roads router in the client
 */

import { Road, RoadsPJAX, ParseBodyMiddleware, RouterMiddleware, CookieMiddleware, Request } from 'roads';
import applyPublicRotues from './routes/applyPublicRoutes';
import emptyTo404 from './middleware/emptyTo404';

const road = new Road();

road.use(function (method, url, body, headers, next) {
	console.log(`fake ${  method  } request to...`, url);
	return next();
});

const pjax = new RoadsPJAX(road, document.getElementById('container') as HTMLAnchorElement, window);
pjax.addTitleMiddleware('roads-title');
road.use(emptyTo404);
road.use(ParseBodyMiddleware.middleware);
// Todo: get this set up properly, then check cokie and stor val on the server
road.use(CookieMiddleware.buildClientMiddleware(document));
pjax.register();
pjax.registerAdditionalElement(document.getElementById('home') as HTMLAnchorElement);
const router = new RouterMiddleware.Router(road);
applyPublicRotues(router);

const testRequest = new Request(false, 'localhost', 8081);
testRequest.request('GET', '/').then(response => {
	console.log('root request test', response);
});