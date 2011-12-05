"use strict";
var Schema = require('mongoose').Schema;
var ObjectId = Schema.ObjectId;

exports.test = new Schema({
	id: ObjectId,
	str_val: {type: String},
	date_val: {type: Date},
	int_val: {type: Number}
});