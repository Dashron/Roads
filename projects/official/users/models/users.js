"use strict";

var model_component = require('roads-models');

var CachedModelModule = model_component.CachedModel;
var connections = model_component.Connection;

var crypto_module = require('crypto');

/**
 * create table users (id int(10) unsigned not null primary key auto_increment, email varchar(256) not null, name varchar(128), password varchar (64) not null)
 */
var UsersModule = module.exports = new CachedModelModule();
UsersModule.connection = connections.getConnection('mysql', 'default');
UsersModule.redis = connections.getConnection('redis', 'default');
UsersModule.setModel({
	table : 'users',
	fields : {
		id : {
			type : 'id'
		},
		email : {
			type : 'email'
		},
		name : {
			type : 'string',
			length : 128
		},
		password : {
			type : 'string',
			length : 64,
			set : function (password) {
				this._password = crypto_module.createHash('sha256').update(password).digest('hex');
			}
		}
	},
	methods : {
		checkPassword : function checkPassword(password) {
			return this._password === crypto_module.createHash('sha256').update(password).digest('hex');
		}
	},
	events : {
		onSave : function (request) {
			UsersModule.addToCachedCollection("getAll", [], this.id, request);
			request._ready(this);
		},
		onDelete : function (request, id) {
			UsersModule.removeFromCachedCollection("getAll", [], id, request);
			request._ready(this);	
		}
	}
});

UsersModule.getAll = function () {
	return this.cachedCollection('select id from users', 'all');
};