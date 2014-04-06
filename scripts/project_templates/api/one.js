"use strict";


module.exports = function transform (data) {
	if (data === null) {
		return null;
	}

	var map = data.map ? data.map : data;

	var result = {
		uri : '/maps/' + map.id,
		name : map.name,
		description : map.description,
		height : map.height,
		width : map.width,
		start_tile : this.json("entyr/maps", "tiles/one", {
			tile : map.start_tile,
			neighbors : data.neighbors
		}),
		tile_side_length : map.tile_side,
		tiles : data.tiles
	};

	return result;
}