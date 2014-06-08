"use strict";


module.exports = function transform (data) {
	if (data === null) {
		return null;
	}

	var {{SUBPROJECT_SINGULAR}} = data.{{SUBPROJECT_SINGULAR}} ? data.{{SUBPROJECT_SINGULAR}} : data;
	var result = this.json('{{PROJECT_NAME}}', '{{SUBPROJECT_PLURAL}}/one');

	result.actions = {
		'delete' : {
			uri : '/{{SUBPROJECT_PLURAL}}/' + {{SUBPROJECT_SINGULAR}}.id,
			method : 'DELETE'
		},
		'edit' : {
			uri : '/{{SUBPROJECT_PLURAL}}/' + {{SUBPROJECT_SINGULAR}}.id,
			method : 'PATCH',
			fields : ['name', 'description']
		}
	};

	return result;
}