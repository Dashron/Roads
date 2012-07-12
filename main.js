"use strict";
var http = require('http');
var resource_component = require('./components/resource');
var Server = require('./components/server').Server;
var Database = require('./components/database').Database;

/*process.on('uncaughtException', function (error) {
	console.log(error);
});*/

new Database("default", {
	hostname: 'localhost',
	user : 'gfw',
	database: 'gfw'
});


var resource_name = process.argv[2] || "example";
var resource = require('./resources/' + resource_name + '/' + resource_name + '.resource');
var server = new Server({
	port : process.env.PORT || process.env.VMC_APP_PORT || 8125,
	resource : resource
});

server.start();

//TODO: enable a "shutdown" function which will close the server and the repl, allowing the script to auto-terminate

// Enable a repl to mess with the server at run time
var context = require('repl').start().context;
// Expose the primary resource to the repl
context.resource = resource;
// Expose the server to the repl
context.server = server;
// Expose the resource component to the repl
context.components = {"resource" : resource_component};
