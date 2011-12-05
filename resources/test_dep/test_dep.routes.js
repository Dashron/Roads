"use strict";
var RegexRouter = require('../../components/router.js').RegexRouter;
var util_module = require('util');

var Router = exports.Router = function TestDepRouter() {
	var _self = this;
	RegexRouter.call(_self);
	
	_self.add(/\d+/, function(request, response, extra, callback) {
		response.end("test_dep:" + request.method + ":" + request.url.pathname + ":" + require('querystring').stringify(request.url.query));
		callback();
	});
};

util_module.inherits(Router, RegexRouter);

/*exports.unmatched = function (request, response, extra, callback) {
	response.end("test_dep:unmatched:" + request.method + ":" + request.url.pathname + ":" + require('querystring').stringify(request.url.query));
	callback();
};*/