"use strict";

var roads = require('../../../index');
var Resource = roads.Resource;

/**
 * [one description]
 * @type {Resource}
 */
module.exports.root = new Resource({
	methods : {
		GET : function (url, body, headers) {
			// In the real world the body of the response should be created from a template engine.
			return new this.Response('<!DOCTYPE html>\
<html>\
<body>\
<script src="/client.brws.js"></script>\
Hello!<br />\
Try the <a href="/test">test link</a>. It\'s available to the server, but is not build in the client! Check your console for proof of the 404!\
</body>\
</html>');
		}
	}
});