"use strict";

module.exports.Promise = Promise;
module.exports.Resource = require('./lib/resource');
module.exports.Response = require('./lib/response');
module.exports.Road = require('./lib/road');
module.exports.Server = require('./lib/httpServer.js');

module.exports.middleware = require('./lib/middleware');

module.exports.HttpError = class HttpError extends Error {
	constructor(message, code) {
		super();
		this.message = message;
		this.code = code;

		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, HttpError);
		} else {
			// FF doesn't support captureStackTrace
			this.stack = (new Error()).stack;
		}
	}
}

module.exports.HttpError.invalid_request = 400;
module.exports.HttpError.unauthorized = 401;
module.exports.HttpError.forbidden = 403;
module.exports.HttpError.not_found = 404;
module.exports.HttpError.method_not_allowed = 405;
module.exports.HttpError.not_acceptable = 406;
module.exports.HttpError.conflict = 409;
module.exports.HttpError.gone = 410;
module.exports.HttpError.unprocessable_entity = 422;
module.exports.HttpError.too_many_requests = 429;

module.exports.HttpError.internal_server_error = 500;