"use strict";

var model_component = require('roads-models');

var CachedModelModule = model_component.CachedModel;
var connections = model_component.Connection;

var Project = require('../../../../base/project');
var UserModule = Project.get('official/user').model('user');

var PostModule = module.exports = new CachedModelModule();
PostModule.connection = connections.getConnection('mysql', 'default');
PostModule.redis = connections.getConnection('redis', 'default');

/**
 * create table blog_post (id int(10) unsigned not null primary key AUTO_INCREMENT, user_id int(10) unsigned not null, title varchar(180) not null, body text)
 */
PostModule.setModel({
	table : 'blog_post',
	fields : {
		id : {
			type : 'id',
		},
		user_id : {
			type : 'id',
			assign_to : 'user',
			model_module : UserModule
		},
		title : {
			type : 'string',
			max_len : 180
		},
		body : {
			type : 'string',
		}
	},
	events : {
		onSave : function (request) {
			PostModule.addToCachedCollection("getForUser", [this.user_id], this.id, request);
			PostModule.addToCachedCollection("getAll", [], this.id, request);
			request._ready(this);
		},
		onDelete : function (request) {
			PostModule.removeFromCachedCollection("getForUser", [this.user_id], this.id, request);
			PostModule.removeFromCachedCollection("getAll", [], this.id, request);
			request._ready(this);	
		}
	}
});

PostModule.getForUser = function (user, pager) {
	var sql = 'select * from blog_post where user_id = ?';
	
	if (pager) {
		sql = sql + pager.getSql();
	}

	return this.cachedCollection(sql, [user.id], 'getForUser');
};

PostModule.getAll = function (pager) {
	var sql = 'select * from blog_post';
	
	if (pager) {
		sql = sql + pager.getSql();
	}

	return this.cachedCollection(sql, 'getAll');
};