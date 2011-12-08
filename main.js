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

//heroku or cloud foundry
server.listen(process.env.PORT || process.env.VMC_APP_PORT || 8125, null, function() {
	console.log('Server running');
});