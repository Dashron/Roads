module.exports = function transform (data) {
	var tile_json = null;
	var items = [];

	for (var i = 0; i < data.users.length; i++) {
		if (data.cur_user) {
			items.push(this.json('official/users', 'one.auth', data.users[i]));
		} else {
			items.push(this.json('official/users', 'one', data.users[i]));
		}
	}

	return this.collection(items);
};