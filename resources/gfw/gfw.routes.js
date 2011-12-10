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
		
		static_file_module.loadFile(extra.resource.directory + '/templates/js' + filename, function (contents) {
			//TODO: Fix here, what happens is when cached this is sent before any logging can be applied, so logging ends up happening after we have sent the headers
			response.writeHead(200, {'Content-Type':'text/javascript'});
			response.end(contents);
			callback();
			
		}, function (error) {
			if(err.code=='ENOENT') {
				response.writeHead(404, {'Content-Type':'text/plain'});
				response.end("File missing");
				callback();
			}
			else {
				response.writeHead(404, {'Content-Type':'text/plain'});
				response.end();
				callback();
			}
		});
	});
};

util_module.inherits(Router, RegexRouter);