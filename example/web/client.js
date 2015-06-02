"use strict";

var roads = require('../../index');
var road = new roads.Road(require('./resources/root').root);

road.request('GET', '/')
	.then(function (response) {
		console.log(response);
	});

road.request('GET', '/test')
	.then(function (response) {
		console.log(response);
	})
	.catch(function (err) {
		console.log(err);
	});