"use strict";


module.exports = function transform (data) {
	if (data === null) {
		return null;
	}

	var {{SUBPROJECT_SINGULAR}} = data.{{SUBPROJECT_SINGULAR}} ? data.{{SUBPROJECT_SINGULAR}} : data;

	var result = {
		uri : '/{{SUBPROJECT_PLURAL}}/' + {{SUBPROJECT_SINGULAR}}.id
	};

	return result;
}