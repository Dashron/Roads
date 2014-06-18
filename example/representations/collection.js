var Promise = require('bluebird');

module.exports = Promise.coroutine(function* (array, representation) {
	var response = {
		total : array.length,
		collection : Promise.coroutine(function* () {
			var promises = [];
			
			for (var i = 0; i < array.length; i++) {
				// yield should be removed from here once https://github.com/petkaantonov/bluebird/issues/236 is resolved
				promises.push(yield representation(array[i]));
			}

			// yield here so it runs in parallel
			return /*yield remove this comment once https://github.com/petkaantonov/bluebird/issues/236 is resolved */ promises;
		})
	};

	return response;
});