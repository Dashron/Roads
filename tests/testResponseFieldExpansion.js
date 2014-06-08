var response_module = require('../lib/response');

/**
 * TEST FIELD EXPANSION
 */
exports.testExpandingSingleField = function (test) {
	var expansion = response_module.expandFields(['test']);

	test.deepEqual({
		'test' : true
	}, expansion);
	test.done();
};

exports.testExpandingMultipleFields = function (test) {
	var expansion = response_module.expandFields(['test', 'stuff']);
	
	test.deepEqual({
		'test' : true,
		'stuff' : true
	}, expansion);
	test.done();
};

exports.testExpandingSingleNestedField = function (test) {
	var expansion = response_module.expandFields(['test.one']);
	
	test.deepEqual({
		'test' : {
			'one' : true
		}
	}, expansion);
	test.done();
};

exports.testExpandingMultipleNestedFields = function (test) {
	var expansion = response_module.expandFields(['test.one', 'hello.one']);
	
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

exports.testExpandingMultipleMatchingNestedFields = function (test) {
	var expansion = response_module.expandFields(['test.one', 'test.two']);
	
	test.deepEqual({
		'test' : {
			'one' : true,
			'two' : true
		}
	}, expansion);
	test.done();
};