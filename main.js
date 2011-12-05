"use strict";
var http = require('http');
var firenode_component = require('./components/firenode/firenode');
//var resource_component = require('./components/resource');

//resource_component.load(process.argv[2]);

//start the server
var server = http.createServer(function (request, response) {
	var Firebug = new (firenode_component.Firebug)(response);
	Firebug.log("hello", "world");
	Firebug.error(new Error('broken!'));
	response.end("test");
	//router.route(req, res, {});
});

//heroku or cloud foundry
server.listen(process.env.PORT || process.env.VMC_APP_PORT || 8125, null, function() {
	console.log('Server running');
});