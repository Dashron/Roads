"use strict";
/**
* httperror.js
* Copyright(c) 2016 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

module.exports = class HttpError extends Error {
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
};

module.exports.invalid_request = 400;
module.exports.unauthorized = 401;
module.exports.forbidden = 403;
module.exports.not_found = 404;
module.exports.method_not_allowed = 405;
module.exports.not_acceptable = 406;
module.exports.conflict = 409;
module.exports.gone = 410;
module.exports.unprocessable_entity = 422;
module.exports.too_many_requests = 429;

module.exports.internal_server_error = 500;