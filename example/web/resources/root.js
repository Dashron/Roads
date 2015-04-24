"use strict";

var roads = require('../../../index');
var Resource = roads.Resource;

/**
 * [one description]
 * @type {Resource}
 */
module.exports.many = new Resource({
	methods : {
		GET : function (url, body, headers) {
			// In the real world the body of the response should be created from a template engine.
			return new this.Response('<!DOCTYPE html>\
<html>\
<body>\
<script src="/client.brws.js"></script>\
Hello!\
</body>\
</html>');
		}
	}
});