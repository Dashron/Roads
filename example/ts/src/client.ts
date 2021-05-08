/**
 * client.js
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This file is an example of using roads router in the client
 */

import { Road, RoadsPJAX, parseBodyMiddleware, SimpleRouter } from 'roads';
const road = new Road();
import applyPublicRotues from './routes/applyPublicRoutes';
import emptyTo404 from './middleware/emptyTo404';

road.use(function (method, url, body, headers, next) {
	console.log(`fake ${  method  } request to...`, url);
	return next();
});

const pjax = new RoadsPJAX(road, document.getElementById('container'), window);
pjax.addTitleMiddleware();
road.use(emptyTo404);
road.use(parseBodyMiddleware);
// Todo: get this set up properly, then check cokie and stor val on the server
road.use(clientCookie(document));
pjax.register();
pjax.registerAdditionalElement(document.getElementById('home'));
const router = new SimpleRouter(road);
applyPublicRotues(router);