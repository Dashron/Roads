"use strict";

var roads = require('../../index.js');
var url_module = require('url');

/**
 * Ensure that the request context is the context provided in the Road constructor
 */
exports.testRoadContextExists = function (test) {
	var response_string = 'blahblahwhatwhatwhat';

	var road = new roads.Road(new roads.Resource({
		methods : {
			GET : function (url, body, headers) {
				return this.request('POST', '/');
			},
			POST : function (url, body, headers) {
				return response_string;
			}
		}
	}));

	road.request('GET', '/')
		.then(function (val) {
			test.deepEqual(val, {
				status: 200,
				body: response_string,
				headers: {}
			});
			test.done();
		})
		.catch(function (e) {
			console.log(e.stack);
			console.log('err');
		});
};

/**
 * Ensure that the request context is the context provided in the Road constructor
 */
exports.testRoadContextPersists = function (test) {
	var response_string = 'blahblahwhatwhatwhat';

	var road = new roads.Road(new roads.Resource({
		methods : {
			GET : function (url, body, headers) {
				return this.confirmString();
			}
		}
	}));

	road.use(function (method, url, body, headers, next) {
		this.confirmString = function () {
			return response_string;
		};

		return next();
	});

	road.request('GET', '/')
		.then(function (val) {
			test.deepEqual(val, {
				status: 200,
				body: response_string,
				headers: {}
			});
			test.done();
		});
};

/**
 * Ensure that the request context is the context provided in the Road constructor
 */
exports.testRoadCoroutineContextPersists = function (test) {
	var response_string = 'blahblahwhatwhatwhat';

	var road = new roads.Road(new roads.Resource({
		methods : {
			GET : function (url, body, headers) {
				return this.confirmString();
			}
		}
	}));

	road.use(function* (method, url, body, headers, next) {
		this.confirmString = function () {
			return response_string;
		};

		return yield next();
	});

	road.request('GET', '/')
		.then(function (val) {
			test.deepEqual(val, {
				status: 200,
				body: response_string,
				headers: {}
			});
			test.done();
		});
};

/**
 * Ensure that we can find the proper resource for a url
 */
exports.testRoadContextUniqueness = function (test) {
	var response_string = 'blahblahwhatwhatwhat';

	var road = new roads.Road(new roads.Resource({
		methods : {
			GET : function (url, body, headers) {
				return this.confirmString();
			}
		}
	}));

	road.use(function* (method, url, body, headers, next) {
		this.confirmString = function () {
			return this.response_string;
		};

		this.response_string = (this.response_string ? this.response_string : '' )+ response_string;

		return yield next();
	});

	road.request('GET', '/')
		.then(function (val) {
			test.deepEqual(val, {
				status: 200,
				body: response_string,
				headers: {}
			});
			test.done();
		});
};

exports.testRoadResourceContextExists = function (test) {
	var road = new roads.Road(new roads.Resource({
		methods : {
			GET : function (url, body, headers) {
				return this.resource_context;
			}
		},
		context : {
			'hello' : 'world'
		}
	}));

	road.request('GET', '/')
		.then(function (val) {
			test.deepEqual(val, {
				status: 200,
				body: {
					"hello" : "world"
				},
				headers: {}
			});
			test.done();
		});
};

exports.testRoadMethodContextExists = function (test) {
	var road = new roads.Road(new roads.Resource({
		methods : {
			GET : {
				fn: function (url, body, headers) {
					return this.method_context.hello;
				},
				hello: "world"
			}
		}
	}));

	road.request('GET', '/')
		.then(function (val) {
			test.deepEqual(val, {
				status: 200,
				body: "world",
				headers: {}
			});
			test.done();
		});
};

exports.testDifferentRoadMethodContextUndefined = function (test) {
	var road = new roads.Road(new roads.Resource({
		methods : {
			GET : {
				fn: function (url, body, headers) {
					return this.method_context.hello;
				},
				hello: "world"
			},
			POST : function (url, body, headers) {
				return "Goodbye";
			}
		}
	}));

	road.use(function (method, url, body, headers, next) {
		if (method === 'GET') {
			test.equal("world", this.method_context.hello);
		} else {
			test.equal(undefined, this.method_context);
		}

		return next();
	});

	road.request('POST', '/')
		.then(function (val) {
			test.deepEqual(val, {
				status: 200,
				body: "Goodbye",
				headers: {}
			});
			test.done();
		});
};
