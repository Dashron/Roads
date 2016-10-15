"use strict";

var http_util = require('../src/util/httpUtil');

/**
 * Test that an object passed to parseBody returns immediately
 */
exports.testParseObjectBody = function (test) {
	var body = {hi: "stuff"};
	test.equal(body, http_util.parseBody(body));
	test.done();
};

/**
 * Test that an array passed to parseBody returns immediately
 */
exports.testParseArrayBody = function (test) {
	var body = [{hi: "stuff"}];
	test.equal(body, http_util.parseBody(body));
	test.done();
};

/**
 * Test that a string passed to parseBody returns immediately
 */
exports.testParseStringBody = function (test) {
	var body = "stuff";
	test.equal(body, http_util.parseBody(body));
	test.done();
};

/**
 * Test that an form post body passed to parseBody returns correctly
 */
exports.testParseQuerystringBody = function (test) {
	var body = "stuff=a&that=b";
	test.deepEqual({stuff:"a", that:"b"}, http_util.parseBody(body, "application/x-www-form-urlencoded"));
	test.done();
};

/**
 * Test that an object encoded as a json string passed to parseBody returns correctly
 */
exports.testParseJSONObjectBody = function (test) {
	var body = '{"stuff":"a", "that":"b"}';
	test.deepEqual({stuff:"a", that:"b"}, http_util.parseBody(body, "application/json"));
	test.done();
};

/**
 * Test that an array encoded as a json string passed to parseBody returns correctly
 */
exports.testParseJSONArrayBody = function (test) {
	var body = '["stuff", "b"]';
	test.deepEqual(["stuff", "b"], http_util.parseBody(body, "application/json"));
	test.done();
};

/**
 * Test that invalid json throws an exception
 */
exports.testParseInvalidJSONBody = function (test) {
	var body = '{stuff yeah';
	test.throws(function () {
		http_util.parseBody(body, "application/json");
	}, 'SyntaxError: Unexpected token s');
	test.done();
};

/**
 * Ensure that a application/json header with an empty body doesn't blow stuff up. 
 *
 * This isn't really a valid workflow, but we should technically allow it.
 */
exports.testParseEmptyStringBody = function (test) {
	var body = '';
	test.equal('', http_util.parseBody(body, "application/json"));
	test.done();
};