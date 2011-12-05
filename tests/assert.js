"use strict";
var assert_module = require('assert');

var Assertion = exports.Assertion = function Assertion(directory, test) {
	this.directory = directory;
	this.test = test;
	this.call_count = 0;
	this.passes = 0;
	this.failures = 0;
};

/**
 * 
 */
Assertion.prototype.directory = null;


/**
 * 
 */
Assertion.prototype.test = null;

/**
 * 
 */
Assertion.prototype.call_count = 0;

/**
 * 
 */
Assertion.prototype.passes = 0;

/**
 * 
 */
Assertion.prototype.failures = 0;

/**
 * 
 */
Assertion.prototype.logTest = function assertion_logTest() {
	if(this.call_count === 0) {
		console.log(this.test);
	}
	this.call_count += 1;
};

/**
 * 
 */
Assertion.prototype.logPass = function assertion_logPass() {
	this.passes += 1;
};

/**
 *  TODO: also take in failure information so you can log out why everything failed
 *  @param error
 */
Assertion.prototype.logFail = function assertion_logFail(error) {
	if(typeof error.message === "string") {
		console.log(error.message);
	}
	console.log(error.stack);
	this.failures += 1;
};


/**
 * 
 * @param actual
 * @param expected
 * @param message
 * @param operator
 */
Assertion.prototype.fail = function assertion_fail(actual, expected, message, operator) {
	this.logTest();
	assert_module.fail(actual, expected, message, operator);
};

/**
 * 
 * @param value
 * @param message
 */
Assertion.prototype.ok = function assertion_ok(value, message) {
	this.logTest();
	try {
		assert_module.ok(value, message);
		this.logPass();
	} catch (error) {
		this.logFail(error);
	}
};

/**
 * 
 * @param test
 * @param expected
 * @param message
 */
Assertion.prototype.equal = function assertion_equal(test, expected, message) {
	this.logTest();
	try {
		assert_module.equal(test, expected, message);
		this.logPass();
	} catch (error) {
		this.logFail(error);
	}
};

/**
 * 
 * @param test
 * @param expected
 * @param message
 */
Assertion.prototype.notEqual = function assertion_notEqual(test, expected, message) {
	this.logTest();
	try {
		assert_module.notEqual(test, expected, message);
		this.logPass();
	} catch (error) {
		this.logFail(error);
	}
};

/**
 * 
 * @param test
 * @param expected
 * @param message
 */
Assertion.prototype.deepEqual = function assertion_deepEqual(test, expected, message) {
	this.logTest();
	try {
		assert_module.deepEqual(test, expected, message);
		this.logPass();
	} catch (error) {
		this.logFail(error);
	}
};

/**
 * 
 * @param test
 * @param expected
 * @param message
 */
Assertion.prototype.notDeepEqual = function assertion_notDeepEqual(test, expected, message) {
	this.logTest();
	try {
		assert_module.notDeepEqual(test, expected, message);
		this.logPass();
	} catch (error) {
		this.logFail(error);
	}
};

/**
 * 
 * @param test
 * @param expected
 * @param message
 */
Assertion.prototype.strictEqual = function assertion_strictEqual(test, expected, message) {
	this.logTest();
	try {
		assert_module.strictEqual(test, expected, message);
		this.logPass();
	} catch (error) {
		this.logFail(error);
	}
};

/**
 * 
 * @param test
 * @param expected
 * @param message
 */
Assertion.prototype.notStrictEqual = function assertion_notStrictEqual(test, expected, message) {
	this.logTest();
	try {
		assert_module.notStrictEqual(test, expected, message);
		this.logPass();
	} catch (error) {
		this.logFail(error);
	}
};

/**
 * 
 * @param block
 * @param error
 * @param message
 */
Assertion.prototype.throws = function assertion_throws(block, error, message) {
	this.logTest();
	try {
		assert_module.throws(block, error, message);
		this.logPass();
	} catch (error) {
		this.logFail(error);
	}
};

/**
 * 
 * @param block
 * @param error
 * @param message
 */
Assertion.prototype.doesNotThrow = function assertion_doesNotThrow(block, error, message) {
	this.logTest();
	try {
		assert_module.doesNotThrow(block, error, message);
		this.logPass();
	} catch (error) {
		this.logFail(error);
	}
};

/**
 * 
 * @param value
 */
Assertion.prototype.ifError = function assertion_ifError(value) {
	this.logTest();
	try {
		assert_module.ifError(value);
		this.logPass();
	} catch (error) {
		this.logFail(error);
	}
};