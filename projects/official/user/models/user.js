"use strict";

var model_component = require('roads-models');

var CachedModelModule = model_component.CachedModel;
var connections = model_component.Connection;

var crypto_module = require('crypto');

/**
 * create table user (id int(10) unsigned not null primary key auto_increment, email varchar(256) not null, name varchar(128), password varchar (64) not null)
 */
var UserModule = module.exports = new CachedModelModule();
UserModule.connection = connections.getConnection('mysql', 'default');
UserModule.redis = connections.getConnection('redis', 'default');
UserModule.setModel({
	table : 'user',
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
			UserModule.addToCachedCollection("getAll", [], this.id, request);
			request._ready(this);
		},
		onDelete : function (request, id) {
			UserModule.removeFromCachedCollection("getAll", [], id, request);
			request._ready(this);	
		}
	}
});

UserModule.getAll = function () {
	return this.cachedCollection('select id from user', 'all');
};