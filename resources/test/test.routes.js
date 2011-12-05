"use strict";
var RegexRouter = require('../../components/router.js').RegexRouter;
var util_module = require('util');

var Router = exports.Router = function TestRouter() {
	var _self = this;
	RegexRouter.call(_self);
	
	_self.add(/\w+/, function(request, response, extra, callback) {
		response.end("test:" + request.method + ":" + request.url.pathname + ":" + require('querystring').stringify(request.url.query));
		callback();
	});
};

exports.unmatched = function (request, response, extra, callback) {
	response.end("test:unmatched:" + request.method + ":" + request.url.pathname + ":" + require('querystring').stringify(request.url.query));
	callback();
};

util_module.inherits(Router, RegexRouter);