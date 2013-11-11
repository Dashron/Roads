module.exports = function transform (data) {
	var result = {
		'actions' : {
			'add' : {
				uri : '/posts',
				method : 'POST',
				fields : ['title', 'body']
			}
		}
	};

	if (data.invalid_field && Object.keys(data.invalid_fields).length) {
		result.error = {
			message : 'Invalid parameters',
			fields : {}
		};

		for (var key in data.invalid_fields) {
			result.error.fields[key] = data.invalid_fields[key];
		}
	}

	return result;
};