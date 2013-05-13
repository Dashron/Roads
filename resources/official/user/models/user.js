"use strict";

var model_component = require('roads-models');

var CachedModelModule = model_component.CachedModel;
var connections = model_component.Connection;

var crypto_module = require('crypto');

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
		},
		xp : {
			type : 'int',
			length : 10
		},
		role : {
			type : 'string',
			length : 32
		}
	},
	methods : {
		checkPassword : function checkPassword(password) {
			return this._password === crypto_module.createHash('sha256').update(password).digest('hex');
		},
		addXP : function addXP(xp) {
			this.connection.query('update user set xp = xp + ? where user_id = ?', [xp, this.id]);
		}
	}
});

UserModule.getAll = function () {
	return this.cachedCollection('select id from user', 'all');
};