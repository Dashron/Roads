"use strict";

var model_component = require('roads-models');

var CachedModelModule = model_component.CachedModel;
var connections = model_component.Connection;

/**
CREATE TABLE `{{SUBPROJECT_PLURAL}}` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`)
)
 */
var {{SUBPROJECT_PLURAL}}Module = module.exports = new CachedModelModule();
{{SUBPROJECT_PLURAL}}Module.connection = connections.getConnection('mysql', 'default');
{{SUBPROJECT_PLURAL}}Module.redis = connections.getConnection('redis', 'default');
{{SUBPROJECT_PLURAL}}Module.setModel({
	table : '{{SUBPROJECT_PLURAL}}',
	fields : {
		id : {
			type : 'id'
		},
		/*
		string : {
			type : 'string',
			length : 20,
			nullable : true
		},
		foreign_id : {
			type : 'id',
			assign_to : 'foreign',
			model_module : ForeignModel
		},
		x : {
			type : 'number',
			length : 5
		},
		*/
	},
	sorts : {
		'most_recent' : {
			field : 'id',
			direction : 'ASC'
		}
	},
	events : {
		onSave : function (request) {
			{{SUBPROJECT_PLURAL}}Module.addToCachedCollection("all", [], this.id, request);
			request._ready(this);
		},
		onDelete : function (request, old_id) {
			{{SUBPROJECT_PLURAL}}Module.removeFromCachedCollection("all", [], old_id, request);
			request._ready(this);
		}
	}
});

{{SUBPROJECT_PLURAL}}Module.getAll = function (sort) {
	return this.cachedCollection('select id from ' + this._definition.table, {
		key : 'all',
		sort : 'most_recent'
	});
};