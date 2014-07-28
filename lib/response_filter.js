"use strict";

var Promise = require('bluebird');

/**
 * [filter description]
 * @param  {[type]} fields [description]
 * @param  {[type]} data   [description]
 * @return {[type]}        [description]
 */
exports.filter = Promise.coroutine(function* filter (fields, data) {
	// If the fields provided was an array, we should turn it into the necessary fields object
	if (Array.isArray(fields)) {
		fields = exports.expandFields(fields);
	}

	// If we have a promise we should immediately expand it. The data is what we are expanding.
	if (data instanceof Promise) {
		data = yield data;
	}

	if (Array.isArray(data)) {
		// if array, check each value
		return yield exports.filterArray(fields, data);
	} else if (typeof(data) === "function") {
		// Expand the function and then filter the contents
		return yield exports.filter(fields, data());
	} else if (data === null) {
		// expand nulls, since typeof(null) === "object"
		return null;
	} else if (typeof(data) === "object") {
		// if object, recurse. Since fields always end with "true", true means "show everything else"
		return yield exports.filterObject(fields, data);

	} 

	// if the data is primitive, assign it directly
	return data;
});

/**
 * 
 * @param  object fields
 * @param  object data
 * @return Promise
 */
exports.filterObject = Promise.coroutine(function* filterObject (fields, data) {
	var new_data = {};

	// if fields is true, we want to loop through all keys, otherwise we loop through all the fields
	var field_keys = fields === true || typeof fields === "undefined" ? Object.keys(data) : Object.keys(fields);

	for (var key in data) {
		// Make sure the property is valid and the field was requested
		if (data.hasOwnProperty(key) && field_keys.indexOf(key) !== -1) {
			new_data[key] = yield exports.filter(fields ? fields[key] : true, data[key]);
		}
	}

	// if the object is empty, we should actually return null
	if (!Object.keys(new_data).length) {
		return null;
	}

	return new_data;
});

/**
 * [filterArray description]
 * @param  {[type]} fields [description]
 * @param  {[type]} value  [description]
 * @return {[type]}        [description]
 */
exports.filterArray = Promise.coroutine(function* filterArray (fields, value) {
	var final_array = [];
	var filtered_value = null;

	for (var i = 0, val_len = value.length; i < val_len; i++) {
		if (value[i] instanceof Promise) {
			value[i] = yield value[i];
		}

		// filter each item in the array with the current level of requested fields
		filtered_value = yield exports.filter(fields, value[i]);

		// if we actually received data, we add it to the array, otherwise don't bother.
		if (filtered_value) {
			final_array.push(filtered_value);
		}
	}

	// if we didn't build an array, return null instead of an empty array
	if (!final_array.length) {
		return null;
	}

	return final_array
});

/**
 * [expandFields description]
 * @param  {[type]} fields [description]
 * @return {[type]}        [description]
 */
exports.expandFields = function expandFields (fields) {
	var data = {};

	// for each field
	for (var i = 0, field_len = fields.length; i < field_len; i++) {
		// split on periods
		var parts = fields[i].split('.');
		var subpart = data;

		// for each part of a period separated field heriarchy
		for (var j = 0, parts_len = parts.length; j < parts_len; j++) {
			// build an object matching that heirarchy
			if (j === parts_len - 1) {
				subpart[parts[j]] = true;
				continue;
			}

			if (!subpart[parts[j]]) {
				subpart[parts[j]] = {};
			}

			subpart = subpart[parts[j]];
		}
	}

	return data;
}