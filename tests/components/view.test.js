"use strict";
var View = require('../../components/view').View;
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var Tests = exports.Tests = function() {
	var _self = this;
	
	var build_view = function(template) {
		var view = new View(template);
		view.setDir(__dirname.replace('tests/components', '') + 'resources/test/templates/');
		view.set('a', 'b');
		view.set('c', 'd');
		
		return view;
	};
	
	var build_view_with_children = function(templateA, templateB) {
		var view = new View(templateA);
		view.setDir(__dirname.replace('tests/components', '') + 'resources/test/templates/');
		view.child('b', templateB);
		
		return view;
	};
	
	var mock_response = function() {
		var Mock = function() {
			var _mock_self = this;
			EventEmitter.call(this);
			
			_mock_self.content = '';
			_mock_self.write = function(data) {
				_mock_self.content += data;
			};
			
			_mock_self.end = function() {
				_mock_self.emit('end');
			};
		};
		util.inherits(Mock, EventEmitter);
		return new Mock();
	};
	
	_self.testConstruct = function(assert) {
		assert.doesNotThrow(function() {
			build_view('test.html');
		});
	};
	
	_self.testSet = function(assert) {
		var view = new View('test.html');
		view.setDir(__dirname.replace('tests/components', '') + 'resources/test/templates/');
		
		assert.doesNotThrow(function() {
			view.set('a', 'z');
		});
	};
	
	_self.testGet = function(assert) {
		var view = build_view('test.html');
		view.setDir(__dirname.replace('tests/components', '') + 'resources/test/templates/');
		
		assert.equal(view.get('a'), 'b');
		assert.equal(view.get('c'), 'd');
		assert.equal(view.get('z'), null);
	};
	
	_self.testChild = function(assert) {
		assert.doesNotThrow(function() {
			build_view_with_children('test.html', 'test_child.html');
		});
	};
	
	_self.testRenderOne = function(assert) {
		var view = build_view('test.html');
		view.setDir(__dirname.replace('tests/components', '') + 'resources/test/templates/');
		
		view.set('a', 'success');
		var response = mock_response();
		response.on('end', function() {
			assert.equal(response.content, "success");
		});
		
		view.render(response);
	};
	
	_self.testRenderChildren = function(assert) {
		var view = build_view('test.html');
		view.setDir(__dirname.replace('tests/components', '') + 'resources/test/templates/');
		
		var child = view.child('a', 'test_child.html');
		child.set('b', 'success2');
		var response = mock_response();
		response.on('end', function() {
			assert.equal(response.content, "success2");
		});
		
		view.render(response);		
	};
};
