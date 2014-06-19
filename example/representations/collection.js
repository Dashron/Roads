var Promise = require('bluebird');

module.exports = function* (array, representation) {
	var response = {
		total : array.length,
		collection : Promise.coroutine(function* () {
			var promises = [];
			
			for (var i = 0; i < array.length; i++) {
				promises.push(representation(array[i]));
			}

			return yield promises;
		})
	};

	return response;
};