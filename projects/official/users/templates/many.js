module.exports = function transform (data) {
	var items = [];

	for (var i = 0; i < data.users.length; i++) {
		items.push(this.json('official/users', 'one', data.users[i]));
	}

	return this.collection(items);
};