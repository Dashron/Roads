"use strict";

var controllers = {};

module.exports.get = function (name) {
	if (typeof controllers[name] === "undefined") {
		controllers[name] = require('../web/controllers/' + name);
	}

	return controllers[name];
};