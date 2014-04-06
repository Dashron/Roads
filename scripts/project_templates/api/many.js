module.exports = function transform (data) {
	var tile_json = null;
	var items = [];

	for (var i = 0; i < data.maps.length; i++) {
		if (data.cur_user) {
			items.push(this.json('entyr/maps', 'maps/one.auth', data.maps[i]));
		} else {
			items.push(this.json('entyr/maps', 'maps/one', data.maps[i]));
		}
	}

	return this.collection(items);
};