"use strict";

var roads = require('../../index.js');


module.exports.testEmptyConstructorFails = function (test) {
	test.throws(function () {
		var road = new roads.road();
	}, "You must configure at least one root resource when constructing your Road");
	test.done();
};

module.exports.testNonResourceFails = function (test) {
	test.throws(function () {
		var road = new roads.road(true);
	}, "You must configure at least one root resource when constructing your Road");
	test.done();
};

module.exports.testSingleResourceCanBeCreated = function (test) {
	var road = new roads.Road(new roads.Resource({
		resources: {
			'main': new roads.Resource({
				methods: {
					GET: function () {
						return 'yeah';
					}
				}
			})
		}
	}));

	test.done();
};

module.exports.testDoubleResourceCanBeCreated = function (test) {
	var road = new roads.Road([new roads.Resource({
		resources: {
			'main': new roads.Resource({
				methods: {
					GET: function () {
						return 'yeah';
					}
				}
			})
		}
	}), new roads.Resource({
		resources: {
			'main': new roads.Resource({
				methods: {
					POST: function () {
						return 'oh my';
					}
				}
			})
		}
	})]);

	test.done();
};