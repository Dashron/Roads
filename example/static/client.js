"use strict";
/**
 * client.js
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 * 
 * This file is an example of using roads router in the client
 */

require("regenerator-runtime/runtime");
var roads = require('../../index.js');
var road = new roads.Road();

road.use(function (method, url, body, headers, next) {
    console.log('fake ' + method + ' request to...', url);
    return next();
});

var pjax = new roads.PJAX(road, document.getElementById('container'), window);
pjax.addTitleMiddleware();
road.use(roads.middleware.emptyTo404);
road.use(roads.middleware.parseBody);
pjax.addCookieMiddleware(document);
pjax.register();
let router = new roads.middleware.SimpleRouter(road);
require('../routes/applyPublicRoutes.js')(router);