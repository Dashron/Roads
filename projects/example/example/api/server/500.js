module.exports = function transform (data) {
	var response = {
		error : 'Server Error'
	};

	if (data.cur_user) {
		response.message = data.error.message;
		response.description = data.error.description;
		response.stacktrace = data.error.stack;
	}

	return response;
}