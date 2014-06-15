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
		var value = data[key];

		// kill any root keys not in the fields index
		if (field_keys.indexOf(key) === -1) {
			delete data[key];
			continue;
		}

		// if array, check each value
		if (Array.isArray(value)) {
			value = yield exports.filterArray(fields[key], value);
			if (value) {
				new_data[key] = value;
			}

		} else if (typeof data[key] === "object") {
			// if object, recurse. Since fields always end with "true", true means "show everything else"
			new_data[key] = yield exports.filterObject(fields[key], value);

		} else if (false/*is function data[key]*/) {
			// if function, expand the function
			new_data[key] = yield exports.expandFunction(fields[key], value);

		} else {
			// if the data is primitive, assign it directly
			new_data[key] = data[key];
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
		if (typeof value[i] === "object") {
			filtered_value = yield exports.filterObject(fields, value[i]);

			if (filtered_value) {
				final_array.push(filtered_value);
			}
		} else {
			final_array.push(value[i]);
		}
	}

	if (!final_array.length) {
		return null;
	}

	return final_array
});


/**
 * [expandFunction description]
 * @param  {[type]}   fields [description]
 * @param  {Function} fn     [description]
 * @return {[type]}          [description]
 */
exports.expandFunction = function expandFunction (fields, fn) {
	var data = Promise.coroutine(fn)();
	return exports.filterObject(fields, data);
};

/**
 * [expandFields description]
 * @param  {[type]} fields [description]
 * @return {[type]}        [description]
 */
exports.expandFields = function expandFields (fields) {
	var data = {};

	for (var i = 0, field_len = fields.length; i < field_len; i++) {
		var parts = fields[i].split('.');
		var subpart = data;

		for (var j = 0, parts_len = parts.length; j < parts_len; j++) {
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