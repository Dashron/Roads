module.exports = function transform (data) {
	var tile_json = null;
	var items = [];

	for (var i = 0; i < data.{{SUBPROJECT_PLURAL}}.length; i++) {
		if (data.cur_user) {
			items.push(this.json('{{PROJECT_NAME}}', 'one.auth', data.{{SUBPROJECT_PLURAL}}[i]));
		} else {
			items.push(this.json('{{PROJECT_NAME}}', 'one', data.{{SUBPROJECT_PLURAL}}[i]));
		}
	}

	return this.collection(items);
};