"use strict";
var RegexRouter = require('../../components/router').RegexRouter;
var static_file_module = require('../../components/static');
var util_module = require('util');
var fs_module = require('fs');

var Router = exports.Router = function TestRouter() {
	var _self = this;
	RegexRouter.call(_self);
	
};

util_module.inherits(Router, RegexRouter);