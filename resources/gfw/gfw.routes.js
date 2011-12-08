"use strict";
var RegexRouter = require('../../components/router.js').RegexRouter;
var util_module = require('util');
var fs_module = require('fs');

var Router = exports.Router = function TestRouter() {
	var _self = this;
	RegexRouter.call(_self);
	
	_self.add(/^\/gfw(\/.+\.js)$/, function(request, response, extra, callback) {
		// don't let people navigate through the folder structure
		var stream = fs_module.createReadStream(extra.resource.directory + '/templates/js' + extra.matches[1].replace(/\.\./, ''));
		
		stream.on('open', function () {
			response.writeHead(200, {'Content-Type':'text/javascript'});
			stream.pipe(response);
		});
		
		stream.on('error', function(err) {
			if(err.code=='ENOENT') {
				response.writeHead(404, {'Content-Type':'text/plain'});
				response.end("File missing");
			}
			else {
				console.log("err");
				response.writeHead(404, {'Content-Type':'text/plain'});
				response.end();
			}
		});
		
		callback();
	});
};

util_module.inherits(Router, RegexRouter);