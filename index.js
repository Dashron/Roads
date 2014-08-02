"use strict";

module.exports.Resource = require('./lib/resource');
module.exports.Response = require('./lib/response');
module.exports.API = require('./lib/api');

module.exports.HttpError = function HttpError(message, code) {
	this.message = message;
	this.code = code;
	Error.captureStackTrace(this, HttpError);
};

require('util').inherits(module.exports.HttpError, Error);