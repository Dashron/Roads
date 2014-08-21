"use strict";

module.exports.Resource = require('./lib/resource');
module.exports.Response = require('./lib/response');
module.exports.FieldsFilter = require('./lib/fieldsfilter');
module.exports.API = require('./lib/api');

module.exports.HttpError = function HttpError(message, code) {
	this.message = message;
	this.code = code;
	Error.captureStackTrace(this, HttpError);
};

module.exports.HttpError.invalid_request = 400;
module.exports.HttpError.unauthorized = 401;
module.exports.HttpError.not_found = 403;

require('util').inherits(module.exports.HttpError, Error);