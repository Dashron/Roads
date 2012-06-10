/*
* gfw.js - model.js
* Copyright(c) 2011 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
*/
"use strict";

var database_module = require('./database');

/**
 * How to use:
 *  var user_module = new model_module.ModelModule();
 *  user_module.connection = 'default';
 *  user_module.setModel({
 *  	table : '',
 *  	fields : {
 *  		name : {
 *  			type : '',
 *  			set : function (){},
 *  			get : function (){}
 *  		}
 *  	},
 *  	methods : {
 *  		name : function (){}
 *  	}
 *  });
 *
 * user_module.do_stuff();
 *  
 */
var Model = module.exports.Model = function Model(data) {
	for (var i in data) {
		this[i] = data[i];
	}

	this.changed = false;
};

Model.prototype.definition = null;
Model.prototype.changed = false;

/**
 * [ModelModule description]
 *
 *
 *
 *
 *
 *
 *
 */
var ModelModule = module.exports.ModelModule = function ModelModule () {
};

ModelModule.prototype.connection = null;

ModelModule.prototype.getConnection = function () {
	return database_module.getConnection(this.connection);
};

ModelModule.prototype.setModel = function (definition) {
	this.definition = definition;
	
	var new_model = function(data) {
		Model.call(this, data);
	};

	new_model.prototype.definition = definition;
	applyModelMethods(new_model, definition);
	applyModelFields(new_model, definition);
	this.Model = new_model;
};

function applyModelMethods (model, definition) {
	for (var i in definition.methods) {
		if (i === 'definition') {
			throw new Error('Invalid model definition provided. "definition" is a reserved word');
		}

		model.prototype[i] = definition.methods[i];
	}
}
	
function applyModelFields (model, definition) {
	for (var i in definition.fields) {
		if (i === 'definition') {
			throw new Error('Invalid model definition provided. "definition" is a reserved word');
		}

		(function (key, field_definition) {
			var property = {
				get : function() {
					return this['_' + key];
				},
				set : function(value) {
					this.changed = true;
					this['_' + key] = value;
				}
			};

			if (field_definition.get) {
				property.get = field_definition.get;
			}

			if (field_definition.set) {
				property.set = function (value) {
					this.changed = true;
					field_definition.set.call(this, value);
				}
			}			

			Object.defineProperty(model.prototype, key, property);
		}(i, definition.fields[i]));
	}
}

ModelModule.prototype.query = function () {
	return this.getConnection().query();
};

ModelModule.prototype.load = function (value, field) {
	var promise = new ModelPromise();

	if (typeof field != "string") {
		field = "id";
	}

	this.query().select('*')
		.from(this.definition.table)
		.where(this.getConnection().name(field) + ' = ?', [value])
		.limit(1)
		.execute(function (err, rows, columns) {
			if (err) {
				console.log(err);
				promise._error(err);
			}

			promise._ready(new exports.Model(rows[0]));
		});

	return promise;
};

/**
 * [ModelPromise description]
 *
 *
 *
 * 
 */
var ModelPromise = exports.ModelPromise = function () {
};

ModelPromise.prototype._error = function (err) {
	this.error = function (fn) {
		fn(err);
	}
};

ModelPromise.prototype.error = function (fn) {
	this._error = fn;
}

ModelPromise.prototype._ready = function (data) {
	this.empty = function (fn) {
		fn(data);
	}
};

ModelPromise.prototype.ready = function (fn) {
	this._ready = fn;
}
