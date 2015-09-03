"use strict";

module.exports.Promise = Promise;
module.exports.Resource = require('./lib/resource');
module.exports.Response = require('./lib/response');
module.exports.Road = require('./lib/road');
module.exports.Server = require('./lib/httpServer.js');

module.exports.middleware = require('./lib/middleware');

module.exports.HttpError = function HttpError(message, code) {
	this.message = message;
	this.code = code;

	if (Error.captureStackTrace) {
		Error.captureStackTrace(this, HttpError);
	} else {
		// FF doesn't support captureStackTrace
		this.stack = (new Error()).stack;
	}
};

module.exports.HttpError.invalid_request = 400;
module.exports.HttpError.unauthorized = 401;
module.exports.HttpError.not_found = 404;

require('util').inherits(module.exports.HttpError, Error);
