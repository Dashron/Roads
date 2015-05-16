var coroutine = require('../lib/coroutine');

/**
 * Normal functions
 */
exports.testCoroutineExecutesNormalFunction = function (test) {
	var result = coroutine(function () {
		return 'yes';
	})();

	test.equal('yes', result);
	test.done();
};

exports.testCoroutineExecutesNormalFunctionAndRetainsContext = function (test) {
	var result = coroutine(function () {
		return this;
	}).bind('what')();

	test.equal('what', result);
	test.done();
};

exports.testCoroutineExecutesNormalFunctionAndRetainsParameters = function (test) {
	var result = coroutine(function (arg1, arg2) {
		return arg1 + arg2;
	})('a', 'b');

	test.equal('ab', result);
	test.done();
};


exports.testCoroutineExecutesFunctionWithoutReturning = function (test) {
	var result = coroutine(function () {
		var a = 1+1;
	})();
	
	test.equal(undefined, result);
	test.done();
};

/**
 * Generator functions without yield
 */
exports.testCoroutineExecutesGeneratorFunction = function (test) {
	var result = coroutine(function* () {
		return 'yes';
	})().then(function (result) {
		test.equal('yes', result);
		test.done();
	})
	.catch(function (err) {
		console.log(err);
		test.fail(err);
		test.done();
	});;
};

exports.testCoroutineExecutesGeneratorFunctionAndRetainsContext = function (test) {
	var result = coroutine(function* () {
		return this;
	}).bind('what')()
	.then(function (result) {
		test.equal('what', result);
		test.done();
	})
	.catch(function (err) {
		console.log(err);
		test.fail(err);
		test.done();
	});;
};

exports.testCoroutineExecutesGeneratorFunctionAndRetainsParameters = function (test) {
	var result = coroutine(function* (arg1, arg2) {
		return arg1 + arg2;
	})('a', 'b').then(function (result) {
		test.equal('ab', result);
		test.done();
	})
	.catch(function (err) {
		console.log(err);
		test.fail(err);
		test.done();
	});
};

exports.testCoroutineExecutesGeneratorFunctionWithoutReturning = function (test) {
	var result = coroutine(function* () {
		var a = 1+1;
	})().then(function (result) {
		test.equal(undefined, result);
		test.done();
	});
};

/**
 * Generator functions with yields
 */
exports.testCoroutineExecutesGeneratorFunctionYieldingPrimitives = function (test) {
	var result = coroutine(function* () {
		var test = yield 'yes';
		return test;
	})().then(function (result) {
		test.equal('yes', result);
		test.done();
	})
	.catch(function (err) {
		console.log(err);
		test.fail(err);
		test.done();
	});
};

exports.testCoroutineExecutesGeneratorFunctionYieldingPromises = function (test) {
	var result = coroutine(function* () {
		var test = yield new Promise(function (resolve, reject) {
			resolve('yes');
		});

		return test;
	})().then(function (result) {
		test.equal('yes', result);
		test.done();
	})
	.catch(function (err) {
		console.log(err);
		test.fail(err);
		test.done();
	});
};

exports.testCoroutineExecutesGeneratorFunctionYieldingPromisesRejectingValues = function (test) {
	var result = coroutine(function* () {
		var test = yield new Promise(function (resolve, reject) {
			reject('yes');
		});

		return test;
	})().catch(function (result) {
		test.equal('yes', result);
		test.done();
	});
};

exports.testCoroutineExecutesGeneratorFunctionYieldingPromisesThrowingErrors = function (test) {
	var result = coroutine(function* () {
		var test = yield new Promise(function (resolve, reject) {
			throw new Error('yes')
		});

		return test;
	})().catch(function (result) {
		test.equal('yes', result.message);
		test.done();
	});
};

exports.testCoroutineExecutesGeneratorFunctionThrowingErrorBeforeYielding = function (test) {
	var result = coroutine(function* () {
		throw new Error('oh no');
		var test = yield "yes";

		return test;
	})().catch(function (result) {
		test.equal('oh no', result.message);
		test.done();
	});
};

/**
 * .bind method still works. NOTE YOU MUST BIND BEFORE YOU WRAP THE COROUTINE
 */
exports.testCorutinePassedThroughBoundContexts = function (test) {
	var fn = coroutine(function* (foo) {
		return this + foo;
	}).bind('hello', 'world');

	fn().then(function (response) {
		test.equal('helloworld', response);
		test.done();
	})
}

exports.testCorutineWithYieldPassedThroughBoundContexts = function (test) {
	var fn = coroutine(function* (foo) {
		var a = yield foo;
		return this + foo;
	}).bind('hello', 'world');

	fn().then(function (response) {
		test.equal('helloworld', response);
		test.done();
	})
}