"use strict";
var fs_module = require('fs');
var Assertion = require('./assert').Assertion;

var Tester = exports.Tester = function() {
	this.assertions = [];
};

/**
 * 
 */
Tester.prototype.assertions = [];

/**
 * 
 * @param directory
 */
Tester.prototype.runAll = function tester_runAll(directory) {
	var self = this;
	
	//read the directory, and find a list of files
	fs_module.readdir(directory, function(err, files) {
		if(err) {
			throw new Error(err);
		}

		//load each file, and assign the routes to this router
		files.forEach(function(file) {
			self.runOne(directory + file);
		});
	});
};

/**
 * 
 * @param file
 */
Tester.prototype.runOne = function tester_runOne(file) {
	var ModuleTests = require(file).Tests;
	var tests = new ModuleTests();
	var assert = null; 
	
	for(var test in tests) {
		assert = new Assertion(file, test);
		this.assertions.push(assert);
		tests[test](assert);
	}
};	