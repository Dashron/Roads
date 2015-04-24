"use strict";

var roads = require('../../index');
var road = new roads.Road(require('./resources/root').many);

road.request('GET', '/')
	.then(function (response) {
		console.log(response);
	});