"use strict";

var roads = require('../../../index');
var Resource = roads.Resource;


module.exports.test = new Resource({
	methods: {
		GET: function () {
			return new this.Response('<!DOCTYPE html>\
<html>\
<body>\
<script src="/client.brws.js"></script>\
This is a private resource. It\'s available to the server, but is not build in the client! Check your console for proof of the 404!\
</body>\
</html>');
		}
	}
});

module.exports.root = new Resource({
	resources: {
		"test" : module.exports.test
	}
});