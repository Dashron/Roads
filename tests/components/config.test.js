"use strict";
var Config = require('../../components/config').Config;

var Tests = exports.Tests = function() {
	var _self = this;
	
	var build_config = function() {
		return new Config({"a" : "b", "c": "d", "e": {"f":"g"}});
	};
	
	_self.testConstruct = function(assert) {
		assert.doesNotThrow(build_config);
	};
	
	_self.testGet = function(assert) {
		var config = build_config();
		
		assert.equal(config.get('a'), 'b');
	};
	
	_self.testSet = function(assert) {
		var config = build_config();

		assert.equal(config.get('a'), 'b');
		assert.doesNotThrow(function() {config.set('a', 'z');});
		assert.equal(config.get('a'), 'z');
	};
};