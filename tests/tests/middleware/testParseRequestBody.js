"use strict";

let roads = require('../../../index.js');

/**
 * Test that valid json parsing works as expected
 */
exports['test request with valid json body'] = function (test) {
    let context = {};
    var body = '{"hello": "there"}';

    roads.middleware.parseBody.call(context, '', '', body, {'content-type': 'application/json'}, () => {});
    test.deepEqual(context.body, {hello: "there"});
    
    test.done();
};

/**
 * Test that valid json parsing works as expected
 */
exports['test request with invalid json body'] = function (test) {
    let context = {};
    var body = '{hello ';

    test.throws(() => {
        roads.middleware.parseBody.call(context, '', '', body, {'content-type': 'application/json'}, () => {});
    }, 'Unexpected token s in JSON at position 1');
    test.done();
};

/**
 * Test that valid json parsing works as expected with roads
 */
exports['test used request with valid json body'] = function (test) {
    var road = new roads.Road();
    road.use(roads.middleware.parseBody);
	var body = '{"hello": "there"}';

    road.use(function (method, url, request_body, headers) {
        test.deepEqual(this.body, {hello: "there"});
        test.done();
    });

	road.request('', '', body, {
		'content-type' : "application/json"
	});
};

/**
 * Test that invalid json parsing fails as expected with roads
 */
exports['test used request with invalid json body'] = function (test) {
    var road = new roads.Road();
    road.use(roads.middleware.parseBody);
	var body = '{hello there';

	road.request('', '', body, {
		'content-type' : "application/json"
    })
    .then(() => {
        test.fail();
        test.done();
    })
    .catch((err) => {
        test.equal(err.message, 'Unexpected token h in JSON at position 1');
        test.done();
    });
};