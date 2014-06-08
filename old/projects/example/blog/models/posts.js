"use strict";

var model_component = require('roads-models');

var CachedModelModule = model_component.CachedModel;
var connections = model_component.Connection;

var Project = require('../../../../base/project');
var UsersModule = Project.get('official/users').model('users');

var PostsModule = module.exports = new CachedModelModule();
PostsModule.connection = connections.getConnection('mysql', 'default');
PostsModule.redis = connections.getConnection('redis', 'default');

/**
 * create table blog_posts (id int(10) unsigned not null primary key AUTO_INCREMENT, user_id int(10) unsigned not null, title varchar(180) not null, body text)
 */
PostsModule.setModel({
	table : 'blog_posts',
	fields : {
		id : {
			type : 'id',
		},
		user_id : {
			type : 'id',
			assign_to : 'user',
			model_module : UsersModule
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
			PostsModule.addToCachedCollection("getForUser", [this.user_id], this.id, request);
			PostsModule.addToCachedCollection("getAll", [], this.id, request);
			request._ready(this);
		},
		onDelete : function (request, id) {
			PostsModule.removeFromCachedCollection("getForUser", [this.user_id], id, request);
			PostsModule.removeFromCachedCollection("getAll", [], id, request);
			request._ready(this);	
		}
	}, 
	sorts : {
		alphabetical : {
			field : 'title',
			direction : 'ASC'
		}
	}
});

PostsModule.getForUser = function (user, pager, sort) {
	var sql = 'select * from blog_posts where user_id = ?';

	return this.cachedCollection(sql, [user.id], {
		key : 'getForUser',
		sort : sort,
		pager : pager
	});
};

PostsModule.getAll = function (pager, sort) {
	var sql = 'select * from blog_posts';

	return this.cachedCollection(sql, {
		key : 'getAll',
		sort : sort,
		pager : pager
	});
};