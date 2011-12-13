"use strict";
var RegexRouter = require('../../components/router').RegexRouter;
var static_file_module = require('../../components/static');
var util_module = require('util');
var fs_module = require('fs');

var Router = exports.Router = function TestRouter() {
	var _self = this;
	RegexRouter.call(_self);
	
	_self.add(/^\/gfw(\/.+\.js)$/, function(request, response, extra, callback) {
		var filename = extra.matches[1].replace(/\.\./, '');
		static_file_module.streamFile(extra.resource.directory + '/templates/js' + filename, response);
	});
};

util_module.inherits(Router, RegexRouter);