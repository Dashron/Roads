/*
module.exports.testSingleResourceCanBeCreated = function (test) {
	var road = new ResourceRouter(new roads.Resource({
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
	var road = new ResourceRouter([new roads.Resource({
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

module.exports.testResourcesCanBeAddedLater = function (test) {
	var road = new ResourceRouter([new roads.Resource({
		resources: {
			'main': new roads.Resource({
				methods: {
					GET: function () {
						return 'yeah';
					}
				}
			})
		}
	})]);

	road.addResource(new roads.Resource({
		resources: {
			'main': new roads.Resource({
				methods: {
					POST: function () {
						return 'oh my';
					}
				}
			})
		}
	}));

	test.done();
};


/**
 * [testRoadResourceContextExists description]
 * @param  {[type]} test [description]
 * @return {[type]}      [description]

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


/**
 * Ensure that the sub routes line up for strings

exports.testStringSubRequest = function (test) {
	var sub_resource = createResource(['GET']);
	var sub_resource2 = createResource(['GET']);

	var resource = createResource(['GET'], {
		'#test' : sub_resource,
		'$stuff' : sub_resource2
	});

	var road = new roads.Road(resource);

	road.request('GET', '/huh', 'yeah', {
		"one" : "two"
	}).then(function (response) {
		test.deepEqual(response, {
			status: 200,
			headers : {},
				body : {
				path : '/huh',
				method : 'GET',
				body : 'yeah',
				headers : {
					'one' : 'two'
				}
			}
		});

		test.done();
	});
};


/**
 * Ensure that the sub routes line up for numbers

exports.testNumberSubRequest = function (test) {
	var sub_resource = createResource(['GET']);
	var sub_resource2 = createResource(['GET']);

	var resource = createResource(['GET'], {
		'#test' : sub_resource,
		'$stuff' : sub_resource2
	});

	var road = new roads.Road(resource);

	road.request('GET', '/1234', 'yeah', {
		"one" : "two"
	}).then(function (response) {
		test.deepEqual(response, {
			status: 200,
			headers : {},
			body : {
				path : '/1234',
				method : 'GET',
				body : 'yeah',
				headers : {
					'one' : 'two'
				}
			}
		});

		test.done();
	});
};

/**
 * Ensure that we get proper errors for invalid HTTP methods, and the middleware properly includes the resource context

exports.testMissingMethodRequestWithHandler = function (test) {
	var resource = new roads.Resource({
		methods : {
			GET : {
				fn: function () {

				},
				hello: "World"
			}
		},
		context: 'I am a context'
	});

	var road = new roads.Road(resource);

	road.use(function (method, url, body, headers, next) {
		test.equal("I am a context", this.resource_context);
		if (method === 'GET') {
			test.equal("World", this.options.hello);
		} else {
			test.equal(undefined, this.options);
		}

		return next();
	});

	road.request('POST', '/', 'yeah', {
		"one" : "two"
	}).then(function (response) {
		// this endpoint should error
		test.ok(false);
		test.done();
	}).catch(function (e) {
		test.equal(e.code, 405);
		test.deepEqual(e.message, ['GET']);
		test.done();
	});
};

/**
 * Ensure a request handler that does not call the actual route returns as expected

exports.testRequestWithHandlerNotCalled = function (test) {
	var resource = createResource(['GET']);
	var road = new roads.Road(resource);
	var response = {"stuff" : "what"};

	road.use(function (url, body, headers, next) {
		return response;
	});//

	road.request('GET', '/', 'yeah', {
		"one" : "two"
	}).then(function (new_response) {
		test.deepEqual(new_response, {
			status: 200,
			headers : {},
			body : response
		});
		test.done();
	});
};

module.exports.testDoubleRootResourceRequestWithNoOverlapSucceeds = function (test) {
	var road = new roads.Road([new roads.Resource({
		methods: {
			GET: function () {
				return 'yeah';
			}
		}
	}), new roads.Resource({
		methods: {
			POST: function () {
				return 'oh my';
			}
		}
	})]);

	road.request('GET', '/', '', {})
	.then(function (response) {
		test.equal(response.body, 'yeah');
		return road.request('POST', '/', '', {});
	})
	.then(function (response) {
		test.equal(response.body, 'oh my');
		test.done();
	});
};

module.exports.testDoubleResourceRequestWithNoOverlapSucceeds = function (test) {
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
			'secondary': new roads.Resource({
				methods: {
					POST: function () {
						return 'oh my';
					}
				}
			})
		}
	})]);

	road.request('GET', '/main')
	.then(function (response) {
		test.equal(response.body, 'yeah');
		return road.request('POST', '/secondary');
	})
	.then(function (response) {
		test.equal(response.body, 'oh my');
		test.done();
	});
};

module.exports.testDoubleResourceRequestWithResourceOverlapChoosesCorrectMethod = function (test) {
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

	road.request('GET', '/main')
	.then(function (response) {
		test.equal(response.body, 'yeah');
		return road.request('POST', '/main');
	})
	.then(function (response) {
		test.equal(response.body, 'oh my');
		test.done();
	});
};

module.exports.testDoubleResourceRequestWithMethodOverlapChoosesFirst = function (test) {
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
					GET: function () {
						return 'oh my';
					}
				}
			})
		}
	})]);

	road.request('GET', '/main')
	.then(function (response) {
		test.equal(response.body, 'yeah');
		test.done();
	});
};

module.exports.testMultipleResourceRequestResourceHitThenMissWill405AndRetainContext = function (test) {
	var road = new roads.Road([new roads.Resource({
		resources: {
			'main': new roads.Resource({
				methods: {
					POST: function () {
						return 'yeah';
					}
				},
				context: 'first resource context'
			})
		}
	}), new roads.Resource({
		resources: {
			'main': new roads.Resource({
				methods: {
					DELETE: function () {
						return 'oh my';
					},
					PUT: function () {
						return 'oh my';
					}
				},
				context: 'second resource context'
			})
		}
	}), new roads.Resource({
		resources: {
			'test': new roads.Resource({
				methods: {
					GET: function () {
						return 'oh my';
					}
				}
			})
		}
	})]);

	road.use(function (method, url, body, headers, next) {
		test.equal('first resource context', this.resource_context);
		return next();
	});

	road.request('GET', '/main')
	.then(function (response) {
		test.fail();
		test.done();
	})
	.catch(function (err) {
		test.equal(err.code, 405);
		test.deepEqual(err.message, ['POST', 'PUT', "DELETE"]);
		test.done();
	});
};
*/