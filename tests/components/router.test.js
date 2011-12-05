"use strict";
var RegexRouter = require('../../components/router').RegexRouter;

var Tests = exports.Tests = function() {
	var _self = this;
	var router_state = null;
	var request = function(method, url) {
		return {method: method, url: url};
	};
	
	var build_router = function(populate) {
		var router = new RegexRouter();
		
		if(populate) {
			router.add(/^\/\D+$/, function() {
				router_state = "get";
			}, "GET");
			
			router.add(/^\/\d+$/, function() {
				router_state = "post";
			}, "POST");
			
			router.add(/^\/\D+$/, function() {
				router_state = "put";
			}, "PUT");
			
			router.add(/^\/\d+$/, function() {
				router_state = "delete";
			}, "DELETE");
		}
		
		return router;
	};
	
	_self.testConstruct = function(assert) {
		assert.doesNotThrow(build_router);
	};
	
	_self.testAdd = function(assert) {
		var router = null;
		assert.doesNotThrow(function() {
			router = build_router(true);
		});

		assert.equal(typeof router.routes["GET"][0], "object");
		assert.equal(typeof router.routes["POST"][0], "object");
		assert.equal(typeof router.routes["PUT"][0], "object");
		assert.equal(typeof router.routes["DELETE"][0], "object");
	};
	
	_self.testRoute = function(assert) {
		var router = null;
		assert.doesNotThrow(function() {
			router = build_router(true);
		});
		
		//success paths
		router.route(request("GET", "/test"), {}, {}, {});
		assert.equal(router_state, "get");
		router_state = null;
		
		router.route(request("POST", "/123"), {}, {}, {});
		assert.equal(router_state, "post");
		router_state = null;
		
		router.route(request("PUT", "/test"), {}, {}, {});
		assert.equal(router_state, "put");
		router_state = null;
		
		router.route(request("DELETE", "/123"), {}, {}, {});
		assert.equal(router_state, "delete");
		router_state = null;
		
		//fail paths
		router.route(request("GET", "/123"), {}, {}, {});
		assert.equal(router_state, null);
		router_state = null;
		
		router.route(request("POST", "/test"), {}, {}, {});
		assert.equal(router_state, null);
		router_state = null;
		
		router.route(request("PUT", "/123"), {}, {}, {});
		assert.equal(router_state, null);
		router_state = null;
		
		router.route(request("DELETE", "/test"), {}, {}, {});
		assert.equal(router_state, null);
		router_state = null;
	};
};