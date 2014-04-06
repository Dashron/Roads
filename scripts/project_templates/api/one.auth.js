"use strict";


module.exports = function transform (data) {
	if (data === null) {
		return null;
	}

	var map = data.map ? data.map : data;
	map.tiles = data.tiles;
	var result = this.json('entyr/maps', 'maps/one', {
		map : map,
		neighbors : data.neighbors,
		tiles : data.tiles
	});

	result.actions = {
		'delete' : {
			uri : '/maps/' + map.id,
			method : 'DELETE'
		},
		'edit' : {
			uri : '/maps/' + map.id,
			method : 'PATCH',
			fields : ['name', 'description']
		}
	};

	return result;
}