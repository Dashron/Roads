"use strict";
var resource_component = require('../../components/resource');

var Tests = exports.Tests = function () {
	var _self = this;

	/**
	 * The test resource, depends on test_dep
	 */
	var build_resource = function () {
		resource_component.clearResources();
		var resource = resource_component.get('test', {"dependencies": ["test_dep"], "info": "banana"});
		return resource;
	};

	/**
	 * The test resource dependency, has no dependencies of it's own
	 */
	var build_resource_dep = function () {
		resource_component.clearResources();
		var resource = resource_component.get('test_dep', {"info": "orange"});
		return resource;
	};

	_self.testConstruct = function (assert) {
		assert.doesNotThrow(build_resource_dep);
		assert.doesNotThrow(build_resource);
	};

	_self.testConfig = function (assert) {
		var resource_dep = build_resource_dep();

		assert.equal(resource_dep.config.info, "orange");
	};

	_self.testDependency = function (assert) {
		var resource = build_resource();
		assert.equal(resource.resources["test_dep"].name, "test_dep");
	};

	_self.testSingleRoutes = function (assert) {
		var resource = build_resource_dep();
		var route_info = '';

		resource.routeRequest({
			url : 'http://www.dashron.com/1234?a=b',
			method : 'GET',
		}, {
			end : function (data) {
				route_info = data;
			}
		}, {}, function () {
			assert.equal('test_dep:GET:/1234:a=b', route_info);
		});
	};

	_self.testDependantRoutes = function (assert) {
		var resource = build_resource();
		var route_info = '';

		resource.routeRequest({
			url : 'http://www.dashron.com/banana?a=b',
			method : 'GET',
		}, {
			end : function (data) {
				route_info = data;
			}
		}, {}, function () {
			assert.equal('test:GET:/banana:a=b', route_info);
		});

		resource.routeRequest({
			url : 'http://www.dashron.com/1234?a=b',
			method : 'GET',
		}, {
			end : function (data) {
				route_info = data;
			}
		}, {}, function () {
			assert.equal('test:GET:/1234:a=b', route_info);
		});
	};

	_self.testUnmatchedRoute = function (assert) {
		var resource = build_resource();
		var route_info = 'empty';

		resource.routeRequest({
			url : 'http://www.dashron.com/$@!',
			method : 'GET',
		}, {
			end : function (data) {
				route_info = data;
			}
		}, {}, function () {
			assert.equal('test:unmatched:GET:/$@!:', route_info);
		});
	};

	_self.testModels = function (assert) {
		var resource = build_resource();
		//var Schema = require('mongoose').Schema;
		var keys = Object.keys(resource.models);
		
		keys.forEach(function(key) {
			assert.equal(resource.models[key].modelName, key);
			//TODO: figure this out
			//assert.ok(resource.models[key] instanceof Schema);
		});
	};
	
	_self.testConnection = function (assert) {
		resource_component.clearResources();
		var resource = resource_component.get('test');
		assert.ok(resource.db.readyState == 1 || resource.db.readyState == 2);
		// if connecting
		if(resource.db.readyState == 2) {
			resource.db.on('open', function() {
				// assert a connection
				assert.equal(resource.db.readyState, 1);
				// clean up
				resource.db.close(function() {
					assert.equal(resource.db.readyState, 0);
				});
			});
		}
	};
};