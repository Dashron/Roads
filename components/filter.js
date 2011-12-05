"use strict";

/**
 * 
 * @param {Mixed} data if alone, the data to parse. if not, the key of the value in the second parameters array to parse
 * @param {Array} [values] of values to choose from
 * @return {InputWrapper}
 */
exports.input = function filter_input(data, values) {
	if(values != null && typeof values != "undefined") {
		data = values[data];
	}
	return new InputWrapper(data);
};

/**
 * @param {Mixed} data
 */
var InputWrapper = function InputWrapper(data) {
	this.data = data;
};

/**
 * Enforce a maxium length on the data
 * @param {Number} max_len
 * @return {InputWrapper}
 */
InputWrapper.prototype.length = function wrapper_length(max_len) {
	if (this.data.length <= max_len) {
		return new InputWrapper(this.data);
	} else {
		return new InputWrapper(null);
	}
};
	
/**
 * 
 * @param {Mixed} default_value
 * @return {Mixed}
 */
InputWrapper.prototype.val = function wrapper_value(default_value) {
	if (this.data == null || typeof this.data == "undefined") {
		if(typeof default_value != "undefined") {
			return default_value;
		}
		
		return null;
	}
	return this.data;
};
	
/**
 * 
 * @param {Function} func
 * @return {InputWrapper}
 */
InputWrapper.prototype.func = function wrapper_func(func) {
	if (func(this.data)) {
		return new InputWrapper(this.data);
	}
	else {
		return new InputWrapper(null);
	}
};

/**
 * 
 * @param {String} type
 * @return {InputWrapper} 
 */
InputWrapper.prototype.type = function wrapper_type(type) {
	type = type.split(":");
	
	switch(type[0]) {
		case "boolean":
		case "string":
		case "number":
		case "function":
		case "undefined":
			if(typeof this.data !== type[0]) {
				return new InputWrapper(null);
			}
			return new InputWrapper(this.data);
			break;
		
		case "date":
			var date_obj = this.data;
			//check if not even a date object
			if ( Object.prototype.toString.call(date_obj) !== "[object Date]" ) {
				//TODO: check if it is a string here?
				date_obj = new Date(date_obj);
			}
			
			//check if not a valid date
			if (isNaN(date_obj.getTime())) {
				return new InputWrapper(null);
			}
			
			return new InputWrapper(date_obj);
			break;
			
		case "array":
			if(Array.isArray(this.data)) {
				return new InputWrapper(this.data);
			}
			
			return new InputWrapper(null);
			
			break;
			
		case "object":
			// @todo allow the type sring to be split and have the second type be the actual object, then incorporate that into the check type[1];
			if(typeof this.data == "object") {
				return new InputWrapper(this.data);
			} else {
				return new InputWrapper(null);
			}
			break;
	}
};

/**
 * 
 * @param {Mixed} data
 * @param {Array} values
 * @returns {OutputWrapper}
 */
exports.output = function filter_output(data, values) {
	if(values != null && typeof values != "undefined") {
		data = values[data];
	}
	
	return new OutputWrapper(data);
};


/*
https://www.owasp.org/index.php/XSS_%28Cross_Site_Scripting%29_Prevention_Cheat_Sheet
& --> &amp;
< --> &lt;
> --> &gt;
" --> &quot;
' --> &#x27;     &apos; is not recommended
/ --> &#x2F;     forward slash is included as it helps end an HTML entity
*/
var _html_entities = {'&':{'regex':/&/g, 'replace': '&amp;'},
						'<':{'regex':/</g, 'replace': '&lt;'},
						'>':{'regex':/>/g, 'replace': '&rt;'},
						'"':{'regex':/"/g, 'replace': '&quot;'},
						"'":{'regex':/'/g, 'replace': '&#x27;'},
						'/':{'regex':/\//g, 'replace': '&#x2F'}};

var _html_keys = Object.keys(_html_entities);

/**
 * 
 */
var OutputWrapper = function OutputWrapper(data) {
	this.data = data;
};
		
/**
 * Convert all html entities in the data
 * @return {OutputWrapper}
 */
OutputWrapper.prototype.html_entities = function wrapper_html_entities() {
	var entity = null;
	var new_data = this.data;
	
	_html_keys.forEach(function(key) {
		entity = _html_entities[i];
		new_data.replace(entity['regex'], entity['replace']);
	});
	
	return new OutputWrapper(new_data);
};