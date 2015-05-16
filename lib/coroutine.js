module.exports = function (generator_function) {
	// This is valid, but it might be better to execute the function and check if the 
	if (['GeneratorFunction'].indexOf(generator_function.constructor.name) === -1) {
		return generator_function;
	}

	return function () {
		// Support binding to the coroutine by passing the context and arguments into the generator function
		var method_this = this;
		var method_args = arguments;

		return new Promise(function (resolve, reject) {
			var generator = generator_function.apply(method_this, method_args);

			var run = function runGenerator (val) {
				var gen_response = null;
				gen_response = generator.next(val);

				if (!gen_response.done) {
					return Promise.resolve(gen_response.value).then(run, reject);
				} else {
					resolve(gen_response.value);
				}
			};

			return run();
		});
	}
}