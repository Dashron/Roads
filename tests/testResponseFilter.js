"use strict";

var filter_module = require('../lib/response_filter');

/**
 * Create a mock object to expand
 * @return {[type]} [description]
 */
function testResponseObject (expand_func) {
	var response = {
		"name" : "aaron",
		"description" : "developer",
		"images" : [{
			"url" : "http://www.dashron.com/image1.png",
			"type" : "profile"
		}, {
			"url" : "http://www.dashron.com/image2.png",
			"type" : "background"
		}],
		"active_image" : {
			"url" : "http://www.dashron.com/image1.png",
			"type" : "profile"
		},
		"delayed" : function () {
			return "hello";
		},
		"delayed_obj" : function () {
			return {
				"test" : "yeah",
				"huh" : "what"
			};
		},
		"delayed_array" : function () {
			return [{
				"name" : "bob",
			}, {
				"name" : "tom"
			}];
		}
	};

	if (expand_func === true) {
		response.delayed = response.delayed();
		response.delayed_obj = response.delayed_obj();
		response.delayed_array = response.delayed_array();
	}

	return response;
}

/**
 * Test that true will render the whole response body
 * 
 * @param  {[type]} test [description]
 * @return {[type]}      [description]
 */
exports.testRenderAllFilter = function (test) {
	test.expect(1);

	var filter = filter_module.filter(true, testResponseObject())
		.then(function (filtered) {
			test.deepEqual(testResponseObject(true), filtered);
			test.done();
		});
};//*/

/**
 * Test that an empty object filter will render out null
 * 
 * @param  {[type]} test [description]
 * @return {[type]}      [description]
 */
exports.testEmptyFilter = function (test) {
	// empty requests no valid 
	test.expect(1);

	filter_module.filter({}, testResponseObject())
		.then(function (filtered) {
			test.deepEqual(null, filtered);
			test.done();
		});
};//*/

/**
 * Test that a single key will filter out everything but that key
 * 
 * @param  {[type]} test [description]
 * @return {[type]}      [description]
 */
exports.testSingleFilter = function (test) {
	test.expect(1);

	filter_module.filter({
		"name" : true
	}, testResponseObject())
		.then(function (filtered) {
			test.deepEqual({
				"name" : "aaron"
			}, filtered);
			test.done();
		});
};//*/

/**
 * Test that multiple keys will filter out everything but those keys
 * 
 * @param  {[type]} test [description]
 * @return {[type]}      [description]
 */
exports.testMultipleFilter = function (test) {
	test.expect(1);

	filter_module.filter({
		"name" : true,
		"description" : true
	}, testResponseObject())
		.then(function (filtered) {
			test.deepEqual({
				"name" : "aaron",
				"description" : "developer"
			}, filtered);
			test.done();
		});
};//*/

/**
 * Test that a filter that wants a key who's value is an object will show the entire object value
 * 
 * @param  {[type]} test [description]
 * @return {[type]}      [description]
 */
exports.testObjectFilter = function (test) {
	test.expect(1);

	filter_module.filter({
		"active_image" : true
	}, testResponseObject())
		.then(function (filtered) {
			test.deepEqual({
				"active_image" :  {
					"url" : "http://www.dashron.com/image1.png",
					"type" : "profile"
				}
			}, filtered);
			test.done();
		});


};//*/

/**
 * Test that a filter that wants the sub-contents of an object will properly display the parent key, and the single sub key
 * 
 * @param  {[type]} test [description]
 * @return {[type]}      [description]
 */
exports.testMultiLevelObjectFilter = function (test) {
	test.expect(1);

	filter_module.filterObject({
		"active_image" : {
			"type" : true
		}
	}, testResponseObject())
		.then(function (filtered) {
			test.deepEqual({
				"active_image" : {
					"type" : "profile"
				}
			}, filtered);
			test.done();
		});


};//*/

/**
 * Test that a filter that sees an array will apply the filter to every value in the array, instead of treating it like an object
 * 
 * @param  {[type]} test [description]
 * @return {[type]}      [description]
 */
exports.testArrayFilter = function (test) {
	test.expect(1);

	filter_module.filterObject({
		"name" : true,
		"images" : true
	}, testResponseObject())
		.then(function (filtered) {
			test.deepEqual({
				"name" : "aaron",
				"images" : [{
					"url" : "http://www.dashron.com/image1.png",
					"type" : "profile"
				},{
					"url" : "http://www.dashron.com/image2.png",
					"type" : "background"
				}]
			}, filtered);
			test.done();
		});
};//*/

/**
 * Test that a multi level filter in an array will return the proper object heirarchy
 * 
 * @param  {[type]} test [description]
 * @return {[type]}      [description]
 */
exports.testMultiLevelArrayFilter = function (test) {
	test.expect(1);

	filter_module.filterObject({
		"name" : true,
		"images" : {
			"url" : true
		}
	}, testResponseObject())
		.then(function (filtered) {
			test.deepEqual({
				"name" : "aaron",
				"images" : [{
					"url" : "http://www.dashron.com/image1.png"
				},{
					"url" : "http://www.dashron.com/image2.png"
				}]
			}, filtered);
			test.done();
		});
};//*/


/**
 * Test that functions are properly expanded
 * 
 * @param  {[type]} test [description]
 * @return {[type]}      [description]
 */
exports.testFunctionFilterLiteral = function (test) {
	test.expect(1);

	filter_module.filterObject({
		"delayed" : true
	}, testResponseObject())
		.then(function (filtered) {
			test.deepEqual({
				"delayed" : "hello"
			}, filtered);
			test.done();
		});
};//*/

/**
 * Test that functions are properly expanded
 * 
 * @param  {[type]} test [description]
 * @return {[type]}      [description]
 */
exports.testFunctionFilterObj = function (test) {
	test.expect(1);

	filter_module.filterObject({
		"delayed_obj" : {
			"test" : true
		}
	}, testResponseObject())
		.then(function (filtered) {
			test.deepEqual({
				"delayed_obj" : {
					"test" : "yeah"
				}
			}, filtered);
			test.done();
		});
};//*/

/**
 * Test that functions are properly expanded
 * 
 * @param  {[type]} test [description]
 * @return {[type]}      [description]
 */
exports.testFunctionArrayFilter = function (test) {
	test.expect(1);

	filter_module.filterObject({
		"delayed_array" : {
			"name" : true
		}
	}, testResponseObject())
		.then(function (filtered) {
			test.deepEqual({
				"delayed_array" : [{
					"name" : "bob"
				}, {
					"name" : "tom"
				}]
			}, filtered);
			test.done();
		});
};//*/