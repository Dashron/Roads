"use strict";
var http = require('http');
var firenode_component = require('./components/firenode/firenode');
var resource_component = require('./components/resource');

var resource_name = process.argv[2] || "example";
var resource = resource_component.get(resource_name);

//start the server
var server = http.createServer(function (request, response) {
	resource.routeRequest(request, response);
});

// port for heroku or cloud foundry or 8125
server.listen(process.env.PORT || process.env.VMC_APP_PORT || 8125, null, function() {
	console.log('Server running');
});

// Enable a repl to mess with the server at run time
var context = require('repl').start().context;
// Expose the primary resource to the repl
context.resource = resource;
// Expose the server to the repl
context.server = server;
// Expose the resource component to the repl
context.components = {"resource" : resource_component};