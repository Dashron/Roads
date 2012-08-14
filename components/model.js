/*
* gfw.js - model.js
* Copyright(c) 2011 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
*/
"use strict";

var database_module = require('./database');
var util_module = require('util');

/**
 * [ModelRequest description]
 *
 *
 *
 * 
 */
var ModelRequest = exports.ModelRequest = function (module) {
	this._module = module;
	this._modifiers = [];
};

ModelRequest.prototype.result = null;
ModelRequest.prototype._final_ready = null;
ModelRequest.prototype._modifiers = null;
ModelRequest.prototype._module = null;

ModelRequest.prototype._error = function (err) {
	this.error = function (fn) {
		fn(err);
	};
};

ModelRequest.prototype.error = function (fn) {
	this._error = fn;
};

ModelRequest.prototype._ready = function (data) {
	var _self = this;
	if (this._modifiers.length) {
		process.nextTick(function () {
			_self._modifiers.shift().call(_self, data);
		});
	} else {
		process.nextTick(function () {
			_self._final_ready(data);
		});
	}
};

ModelRequest.prototype.ready = function (fn) {
	this._final_ready = fn;
};

ModelRequest.prototype.addModifier = function (fn) {
	this._modifiers.push(fn);
};

/**
 * This performs sql joins from within node, instead of mysql.
 * 
 * Each model provided to the final ready function will have the associated model for 
 * any preloaded fields added to the model.
 * 
 * A model definition needs two fields for preload to work, assign_to and model_module.
 * assign_to is the property on the model which will contain the associated object.
 * model_module is the model module that will handle all db and model information.
 * 
 * so if you call preload('user_id') on a model who has a defintion of
 * 
 * user_id : {
 * 	type : id,
 * 	assign_to : "user", 
 * 	model_module : require('../../user/models/user.model')
 * }
 * 
 * each model passed to your return callback will have a "user" property containing the associated model.
 * 
 * @param  {String} field
 */
ModelRequest.prototype.preload = function (field) {
	if (typeof this._module.definition.fields[field] !== "object") {
		throw new Error('The field ' + field + ' is not part of the model definition');
	}

	var field_definition = this._module.definition.fields[field];

	if (typeof field_definition.assign_to !== "string") {
		throw new Error('Any preloaded objects must have an assign_to field in their definition');
	}

	var assign_to = field_definition.assign_to;

	if (typeof field_definition.model_module !== "object") {
		throw new Error('Any preloaded objects must have a model field in their definition');
	}

	var model_module = field_definition.model_module;
	var original_promise = this;

	this.addModifier(function (data) {
		var ids = new Array(data.length);
		var i = 0;
		var model_associations = {};
		var model_promise = null;

		// find all of the ids from the data array
		for (i = 0; i < data.length; i++) {
			ids[i] = data[i][field];
		}

		// find all associated models where the id = data[field]
		model_promise = model_module.collection('select * from ' + model_module.definition.table + ' where id in (' + ids.join(',') + ')');

		model_promise.ready(function (models) {
			// build a list of id => model to ensure a record exists
			for (i = 0; i < models.length; i++) {
				model_associations[models[i].id] = models[i];
			}

			for (i = 0; i < data.length; i++) {
				if (typeof model_associations[data[i][field]] !== "undefined" && typeof model_associations[data[i][field]] !== null) {
					// this won't work because it will overwrite the model variable, and any future saves will be fucked up
					// this needs to be assigned to a private variable, which is then requested via another manner.
					// we might be able to just build the new field off of the old field name, or set up an alias in the sql statement
					data[i][assign_to] = model_associations[data[i][field]];
				}
			}

			original_promise._ready(data);
		});

		model_promise.error(function (error) {
			original_promise._error(error);
		});
	});
};

var Model = module.exports.Model = function Model (data) {
	// todo: maybe don't double initalize?
	// we have to set this here because the prototype has to be null otherwise all objects share the field list
	this.updated_fields = {};

	for (var key in data) {
		this['_' + key] = data[key];
	}

	// we have to set this a second time to wipe out any updated field markers from setting the initial data
	this.updated_fields = {};
};

Model.prototype.definition = null;
Model.prototype.updated_fields = null;

Model.prototype.save = function () {
	var _self = this;
	var request = new ModelRequest(this);
	var keys = Object.keys(this.updated_fields);
	var values = [];
	var i = 0;

	//todo don't allow save to be called on a deleted object
	if (keys.length > 0) {
		if (typeof this.id === "undefined" || this.id === null) {
			var placeholders = [];

			for (i = 0; i < keys.length; i++) {
				values.push(this['_' + keys[i]]);
				placeholders.push('?');
			}

			this.connection.query(
				'insert into `' + this.definition.table + '` (`' + keys.join('`, `') + '`) VALUES (' + placeholders.join(', ') + ')', 
				values,
				function(error, result) {
					request.result = result;

					if (error) {
						request._error(error);
						return;
					}

					_self.id = result.insertId;
					_self.updated_fields = [];
					request._ready(_self);
				}
			);
		} else {
			for (i = 0; i < keys.length; i++) {
				values.push(this['_' + keys[i]]);
			}
			
			values.push(this.id);

			this.connection.query(
				'update `' + this.definition.table + '` set `' + keys.join('` = ?, `') + '` = ? where `id` = ?', 
				values, 
				function (error, result) {

					request.result = result;
					if (error) {
						request._error(error);
						return;
					}
					_self.updated_fields = [];
					request._ready(_self);
				}
			);
		}
	} else {
		process.nextTick(function () {
			request._ready(_self);
		});
	}

	return request;
};

Model.prototype.delete = function () {
	var request = new ModelRequest(this);

	this.connection.query('delete from `' + this.definition.table + '` where `id` = ?', 
		[this.id], 
		function (error, result) {
			request.result = result;

			if (error) {
				request._error(error);
				return;
			}

			// todo: mark the model as deleted, so it does not accidentally get used in other locations
			request._ready(null);
		}
	);

	return request;
};

/**
 * How to use:
 *  var user_module = new model_module.ModelModule();
 *  user_module.connection = new Database('default');
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
var ModelModule = module.exports.ModelModule = function ModelModule () {
};

ModelModule.prototype.connection = null;

function applyModelMethods (model, definition) {
	for (var i in definition.methods) {
		if (i === 'definition') {
			throw new Error('Invalid model definition provided. "definition" is a reserved word');
		}

		model.prototype[i] = definition.methods[i];
	}
}

function addProperty (model, key, field_definition) {
	var property = {
		get : function() {
			return this['_' + key];
		},
		set : function(value) {
			this.updated_fields[key] = true;
			this['_' + key] = value;
		}
	};

	if (field_definition.get) {
		property.get = field_definition.get;
	}

	if (field_definition.set) {
		property.set = function (value) {
			this.updated_fields[key] = true;
			field_definition.set.call(this, value);
		};
	}			

	Object.defineProperty(model.prototype, key, property);
}

function applyModelFields (model, definition) {
	for (var field in definition.fields) {
		if (field === 'definition') {
			throw new Error('Invalid model definition provided. "definition" is a reserved word');
		}
		addProperty(model, field, definition.fields[field]);
	}
}

ModelModule.prototype.setModel = function (definition) {
	var model_module = this;
	this.definition = definition;
	
	var NewModel = function(data) {
		Model.call(this, data);
	};
	util_module.inherits(NewModel, Model);

	NewModel.prototype.definition = definition;
	applyModelMethods(NewModel, definition);
	applyModelFields(NewModel, definition);

	NewModel.prototype.connection = model_module.connection;

	this.Model = NewModel;
};

ModelModule.prototype.load = function (value, field) {
	var _self = this;
	var request = new ModelRequest(this);

	if (typeof field !== "string") {
		field = "id";
	}

	this.connection.query(
		'select * from `' + this.definition.table + '` where `' + field + '` = ? limit 1', 
		[value], 
		function (err, rows, columns) {
			if (err) {
				request._error(err);
				return;
			}

			if (rows.length === 0) {
				// todo: should I use ready, error and empty? or just pass null to ready?
				request._ready(null);
				return;
			}

			request._ready(new _self.Model(rows[0]));
		}
	);

	return request;
};

/**
 * Returns an array of all the models found by the provided sql
 * @param  {String} sql   
 * @param  {Object} params key value map
 * @return {Array}        Array of models
 */
ModelModule.prototype.collection = function (sql, params) {
	var request = new ModelRequest(this);
	var _self = this;
	this.connection.query(sql, params, function (err, rows, columns) {
		if (err) {
			request._error(err);
			return;
		}

		var models = new Array(rows.length);

		for (var i = 0; i < rows.length; i++) {
			models[i] = new _self.Model(rows[i]);
		}

		request._ready(models);
	});

	return request;
};