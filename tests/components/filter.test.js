"use strict";
var filter = require('../../components/filter');

var Tests = exports.Tests = function() {
	var _self = this;
	
	_self.testVal = function(assert) {
		assert.equal('banana', filter.input('banana').val());
		assert.equal('banana', filter.input('banana').val('orange'));
		assert.equal('orange', filter.input(null).val('orange'));
	};
	
	_self.testLength = function(assert) {
		assert.equal('banana', filter.input('banana').length(20).val());
		assert.equal(null, filter.input('banana').length(2).val());
	};
	
	_self.testFunc = function(assert) {
		
		assert.equal('banana', filter.input('banana').func(function(data) {
			if(data == 'banana') {
				return true;
			}
			return false;
		}).val());
		
		assert.equal(null, filter.input('banana').func(function(data) {
			if(data == 'banana') {
				return false;
			}
			return true;
		}).val());
	};
	
	_self.testTypeMatches = function(assert) {
		assert.equal('banana', filter.input(['banana']).type('array').val());
		assert.equal(new Date(2012, 11, 20, 0, 0, 0).getTime(), filter.input(new Date(2012, 11, 20, 0, 0, 0)).type('date').val().getTime());
		assert.equal(true, filter.input(true).type('boolean').val());
		assert.equal(false, filter.input(false).type('boolean').val());
		assert.equal('banana', filter.input('banana').type('string').val());
		var func = function() {};
		assert.equal(func, filter.input(func).type('function').val());
		assert.equal(12345, filter.input(12345).type('number').val());
	};
	
	_self.testTypeMisses = function(assert) {
		assert.notEqual('orange', filter.input(['banana']).type('array').val());
		assert.notEqual('orange', filter.input(new Date()).type('date').val());
		assert.notEqual('orange', filter.input(true).type('boolean').val());
		assert.notEqual('orange', filter.input(false).type('boolean').val());
		assert.notEqual('orange', filter.input('banana').type('string').val());
		assert.notEqual('orange', filter.input(function(){}).type('function').val());
		assert.notEqual('orange', filter.input(12345).type('number').val());
	};
};