var response_module = require('../lib/response');


function testResponseObject () {
	return {
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
		}
	};
};

/**
 * TEST FILTER OBJECTS
 */

exports.testNullFilter = function (test) {
	test.expect(1);

	var filter = response_module.filterObject(true, testResponseObject())
		.then(function (filtered) {
			test.deepEqual(testResponseObject(), filtered);
			test.done();
		});
};//*/

exports.testEmptyFilter = function (test) {
	// empty requests no valid 
	test.expect(1);

	response_module.filterObject({}, testResponseObject())
		.then(function (filtered) {
			test.deepEqual(null, filtered);
			test.done();
		});
};//*/

exports.testSingleFilter = function (test) {
	test.expect(1);

	response_module.filterObject({
		"name" : true
	}, testResponseObject())
		.then(function (filtered) {
			test.deepEqual({
				"name" : "aaron"
			}, filtered);
			test.done();
		});
};//*/

exports.testMultipleFilter = function (test) {
	test.expect(1);

	response_module.filterObject({
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

exports.testObjectFilter = function (test) {
	test.expect(1);

	response_module.filterObject({
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

exports.testMultiLevelObjectFilter = function (test) {
	test.expect(1);

	response_module.filterObject({
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

exports.testArrayFilter = function (test) {
	test.expect(1);

	response_module.filterObject({
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

exports.testMultiLevelArrayFilter = function (test) {
	test.expect(1);

	response_module.filterObject({
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
