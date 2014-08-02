"use strict";

var filter_module = require('../lib/response_filter');

/**
 * Test that single fields can be expanded properly
 * 
 * @param  {[type]} test [description]
 * @return {[type]}      [description]
 */
exports.testExpandingSingleField = function (test) {
	var expansion = filter_module.expandFields(['test']);

	test.deepEqual({
		'test' : true
	}, expansion);
	test.done();
};

/**
 * Test that multipble fields can be expanded properly
 * 
 * @param  {[type]} test [description]
 * @return {[type]}      [description]
 */
exports.testExpandingMultipleFields = function (test) {
	var expansion = filter_module.expandFields(['test', 'stuff']);
	
	test.deepEqual({
		'test' : true,
		'stuff' : true
	}, expansion);
	test.done();
};

/**
 * Test that nested fields are expanded properly
 * 
 * @param  {[type]} test [description]
 * @return {[type]}      [description]
 */
exports.testExpandingSingleNestedField = function (test) {
	var expansion = filter_module.expandFields(['test.one']);
	
	test.deepEqual({
		'test' : {
			'one' : true
		}
	}, expansion);
	test.done();
};

/**
 * Test that multiple nested fields are expanded properly
 * 
 * @param  {[type]} test [description]
 * @return {[type]}      [description]
 */
exports.testExpandingMultipleNestedFields = function (test) {
	var expansion = filter_module.expandFields(['test.one', 'hello.one']);
	
	test.deepEqual({
		'test' : {
			'one' : true
		},
		'hello' : {
			'one' : true
		}
	}, expansion);
	test.done();
};

/**
 * Test that multiple nested fields with similar parents are expanded properly
 * @param  {[type]} test [description]
 * @return {[type]}      [description]
 */
exports.testExpandingMultipleMatchingNestedFields = function (test) {
	var expansion = filter_module.expandFields(['test.one', 'test.two']);
	
	test.deepEqual({
		'test' : {
			'one' : true,
			'two' : true
		}
	}, expansion);
	test.done();
};