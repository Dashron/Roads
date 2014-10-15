"use strict";

var roads = require('../index');
var url_module = require('url');

/**
 * Test that getData with a promise is still the original promise
 */
exports.testPromiseGetData = function (test) {
	var response_data = {
		message : "hello"
	};

	var promise = new roads.Promise(function (resolve, reject) {
		resolve(response_data);
	});

	var res = new roads.Response(promise);
	test.equal(promise, res.data);
	test.done();
};

/**
 * Test that getData with a non promise is translated into a promise
 */
exports.testGetObjectData = function (test) {
	var response_data = {
		message : "hello"
	};

	var res = new roads.Response(response_data);

	test.equal(response_data, res.data);
	test.done();
};

/**
 * Test that a response built around a promise is thenable, and returns the original data
 */
exports.testGetDataIsThenable = function (test) {
	var response_data = {
		message : "hello"
	};

	var promise = new roads.Promise(function (resolve, reject) {
		resolve(response_data);
	});

	var res = new roads.Response(promise);

	res.data.then(function (data) {
		test.equal(data, response_data);
		test.done();
	});
};

/**
 * Ensure that a response built around direct data (not a promise) becomes a promise, is thenable, and returns the original data
 */
exports.testNonPromiseGetData = function (test) {
	var response_data = {
		message : "hello"
	};

	var res = new roads.Response(response_data);

	test.equal(res.data, response_data);
	test.done();
};

/**
 * Ensure when no status code is provided, it defaults to 200
 */
exports.testWriteDefaultStatus = function (test) {
	var res = new roads.Response("hello");
	res.writeToServer({
		writeHead : function (status, headers) {
			this.status = status;
			this.headers = headers;
		},
		write : function (contents) {
			test.equal(this.status, 200);
			test.deepEqual(this.headers, {});
			test.done();
		}
	});
};

/**
 * Ensure custom headers are set properly
 */
exports.testWriteCustomHeaders = function (test) {
	var res = new roads.Response("hello", 200, {"hello" : "goodbye"});
	res.writeToServer({
		writeHead : function (status, headers) {
			this.status = status;
			this.headers = headers;
		},
		write : function (contents) {
			test.deepEqual(this.headers, {"hello" : "goodbye"});
			test.done();
		}
	});
};

/**
 * Ensure that strings passed to the response object are written as is
 */
exports.testWriteString = function (test) {
	var res = new roads.Response("hello", 1234);
	res.writeToServer({
		writeHead : function (status, headers) {
			this.status = status;
			this.headers = headers;
		},
		write : function (contents) {
			test.equal(contents, "hello");
			test.equal(this.status, 1234);
			test.deepEqual(this.headers, {});
			test.done();
		}
	});
};

/**
 * Ensure that objects passed to the response object are written as JSON
 */
exports.testWriteObject = function (test) {
	var res = new roads.Response({"hello" : 1}, 1234);
	res.writeToServer({
		writeHead : function (status, headers) {
			this.status = status;
			this.headers = headers;
		},
		write : function (contents) {
			test.deepEqual(contents, '{"hello":1}');
			test.equal(this.status, 1234);
			test.deepEqual(this.headers, {"content-type" : "application/json"});
			test.done();
		}
	});
};

/**
 * Ensure that existing content-type headers are not overriden by writeToServer
 */
exports.testWriteObject = function (test) {
	var res = new roads.Response({"hello" : 1}, 1234, {"content-type" : "text/html"});
	res.writeToServer({
		writeHead : function (status, headers) {
			this.status = status;
			this.headers = headers;
		},
		write : function (contents) {
			test.deepEqual(contents, '{"hello":1}');
			test.equal(this.status, 1234);
			test.deepEqual(this.headers, {"content-type" : "text/html"});
			test.done();
		}
	});
};