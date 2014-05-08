"use strict";

var model_component = require('roads-models');

var CachedModelModule = model_component.CachedModel;
var connections = model_component.Connection;

var crypto_module = require('crypto');
var Config = require('../../../../base/config');

/**
CREATE TABLE `users` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(256) NOT NULL,
  `name` varchar(128) DEFAULT NULL,
  `password` varchar(64) NOT NULL,
  `permissions` int(10) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) 
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
		},
		permissions : {
			type : 'number',
			length : 10
		}
	},
	methods : {
		checkPassword : function checkPassword (password) {
			if (!password) {
				return false;
			}
			return this._password === crypto_module.createHash('sha256').update(password).digest('hex');
		},
		getPermissions : function getPermissions () {
			var _self = this;

			if (!this._perm_bitwise) {
				this._perm_bitwise = new BitwiseHelper(_self.permissions, Config.get('web.user.permissions'), function (val, enable) {
					if (enable) {
						_self.permissions = _self.permissions | val;
					} else {
						_self.permissions = _self.permissions ^ val;
					}
				});
			}

			return this._perm_bitwise;
		},
		hasPermission : function hasPermission (permission) {
			return this.getPermissions().has(permission);
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

	if (typeof val === "undefined" || isNaN(val)) {
		throw new Error('You must provide a valid bitwise value to the bitwise helper');
	}

	if (!typeof constants === "object" && constants != null) {
		throw new Error('You must provide an array of variable constants to the bitwise helper');
	}

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

	return (this.val & val) === val;
};

/**
 * [enable description]
 * @param  {[type]} constant [description]
 * @return {[type]}          [description]
 */
BitwiseHelper.prototype.enable = function (constant) {
	this.val = this.val | this.constants[constant];
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