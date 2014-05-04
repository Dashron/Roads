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
			if (!password) {
				return false;
			}
			return this._password === crypto_module.createHash('sha256').update(password).digest('hex');
		}
	},
	sorts : {
		'most_recent' : {
			field : 'id',
			direction : 'ASC'
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

UsersModule.getAll = function (sort) {
	return this.cachedCollection('select id from ' + this._definition.table, {
		key : 'getAll',
		sort : 'most_recent'
	});
};


/**
 * [BitwiseHelper description]
 * @param {[type]} val       [description]
 * @param {[type]} constants [description]
 * @param {[type]} changeVal [description]
 */
var BitwiseHelper = function (val, constants, changeVal) {
	this.val = val;
	this.constants = constants;
	this.changeVal = changeVal;
};

BitwiseHelper.prototype.val = null;
BitwiseHelper.prototype.constants = null;

/**
 * [has description]
 * @param  {[type]}  constant [description]
 * @return {Boolean}          [description]
 */
BitwiseHelper.prototype.has = function (constant) {
	var val = this.constants[constant];

	if (typeof val === "undefined" || val === null) {
		throw new Error('Constant ' + constant + ' is not defined in the user config');
	}

	return val & this.val === val;
};

/**
 * [enable description]
 * @param  {[type]} constant [description]
 * @return {[type]}          [description]
 */
BitwiseHelper.prototype.enable = function (constant) {
	this.val = this.val & this.constants[constant];
	this.changeVal(this.constants[constant], true);
};

/**
 * [disable description]
 * @param  {[type]} constant [description]
 * @return {[type]}          [description]
 */
BitwiseHelper.prototype.disable = function (constant) {
	this.val = this.val ^ this.constants[constant];
	this.changeVal(this.constants[constant], false);
};

/**
 * [toArray description]
 * @return {[type]} [description]
 */
BitwiseHelper.prototype.toArray = function () {
	var constants = [];

	for (var key in this.constants) {
		if (this.has(key)) {
			constants.push(key);
		}
	}

	return constants;
}