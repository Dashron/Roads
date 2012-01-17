"use strict";
var RegexRouter = require('../../components/router').RegexRouter;
var util_module = require('util');
var resource_component = require('../../components/resource');

var Router = exports.Router = function TestRouter() {
	var _self = this;
	RegexRouter.call(_self);
	
	_self.add(/^\/$/, function (request, response, callback) {
		// TODO cleanup
		resource_component.get('example').template('index.html', function (contents) {
			response.contentType('text/html');
			response.ok(contents);
			callback();
		}, function (error) {
			response.notFound();
			callback();
		});
	});
	
	/*_self.add(/\w+/, function(request, response, extra, callback) {
		response.end("test:" + request.method + ":" + request.url.pathname + ":" + require('querystring').stringify(request.url.query));
		callback();
	})*/;
};

exports.unmatched = function (request, response, callback) {
	response.notFound();
	callback();
};

util_module.inherits(Router, RegexRouter);