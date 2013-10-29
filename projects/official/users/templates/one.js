module.exports = function transform (data) {
	if (data === null) {
		return null;
	}

	var user = data.user ? data.user : data;

	return {
		uri : '/users/' + user.id,
		email : user.email
	}
};