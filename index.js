"use strict";
/**
* index.js
* Copyright(c) 2016 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

module.exports.Promise = Promise;
module.exports.Resource = require('./src/resource.js');
module.exports.Response = require('./src/response.js');
module.exports.Road = require('./src/road.js');
module.exports.Server = require('./src/httpServer.js');

// Expose all integration helpers
module.exports.integrations = {
	koa: require('./src/integrations/koa.js')
};

// Expose all middleware functions
module.exports.middleware = {
	applyToContext: require('./src/middleware/applyToContext.js'),
	cors: require('./src/middleware/cors.js'),
	cookie: require('./src/middleware/cookie.js'),
	killSlash: require('./src/middleware/killSlash.js'),
	reroute: require('./src/middleware/reroute.js')
};

// Expose a useful http error class
module.exports.HttpError = require('./src/httperror.js');