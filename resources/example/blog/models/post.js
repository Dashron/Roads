"use strict";

var model_component = require('roads-models');

var CachedModelModule = model_component.CachedModel;
var connections = model_component.Connection;

var PostModule = module.exports = new CachedModelModule();
PostModule.connection = connections.getConnection('mysql', 'default');
PostModule.redis = connections.getConnection('redis', 'default');
PostModule.setModel({
	table : 'blog_post',
	fields : {
		id : {
			type : 'id',
		},
		user_id : {
			type : 'id',
			// required for any preload field
			assign_to : 'user',
			//model_module : require('../../user/models/user.model')
		},
		title : {
			type : 'string',
			max_len : 180
		},
		body : {
			type : 'string',
		}
	}
});

PostModule.getForUser = function (user, pager) {
	var sql = 'select * from blog_post where user_id = ?';
	
	if (typeof pager === "object") {
		sql = sql + pager.getSql();
	}

	return this.collection(sql, [user.id]);
};

PostModule.getAll = function (pager) {
	var sql = 'select * from blog_post';
	
	if (typeof pager === "object") {
		sql = sql + pager.getSql();
	}

	return this.collection(sql);
};