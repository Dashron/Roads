"use strict";
var http = require('http');
var resource_component = require('./components/resource');
var Server = require('./components/server').Server;

/*process.on('uncaughtException', function (error) {
	console.log(error);
});*/

var resource = resource_component.get(process.argv[2] || "example");
var server = new Server(process.env.PORT || process.env.VMC_APP_PORT || 8125);

server.resource = resource
server.start();

//TODO: enable a "shutdown" function which will close the server and the repl, allowing the script to auto-terminate

// Enable a repl to mess with the server at run time
var context = require('repl').start().context;
// Expose the primary resource to the repl
context.resource = resource;
// Expose the server to the repl
context.server = server;
// Expose the resource component to the repl
context.components = {"resource" : resource_component, "static" :require('./components/static')};