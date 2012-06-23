/*
* gfw.js - config.js
* Copyright(c) 2011 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
*/
"use strict";

/**
 * Returns the ideal content type from the accept string, which is also in your list of valid types
 * @param  {string} accept          the accept header from the http request
 * @param  {Array} valid_types  an array of content types that you are willing to respond with
 * @return {string}                 a single content type
 */
exports.getContentType = function (accept, valid_types) {
	var mime_types = parseAcceptHeader(accept);
	var i = 0;
	var j = 0;
	var highest_quality = -1;
	var type_index = -1;
	
	if (mime_types.preferred.length > 0) {
		for (i = 0; i < valid_types.length; i++) {
			if (mime_types.preferred[valid_types[i]] === true) {
				return valid_types[i];
			}
		}
	}

	if (mime_types.secondary.length > 0) {
		for (i = 0; i < valid_types.length; i++) {
			if (mime_types.secondary[j].media_range === valid_types[i]) {
				if (highest_quality < mime_types.secondary[j].quality) {
					highest_quality = mime_types.secondary[j].quality;
					type_index = i;
				}
			}
		}
	}

	if (typeof valid_types[type_index] != "undefined" && valid_types[type_index] != null) {
		return valid_types[type_index];
	}

	//todo: replace with configurable default
	return 'text/html';
};

// todo finish and fix to use standard http_request
var parseAcceptHeader = function (accept) {
	// Identify the pattern of mime/type; q=#.#
	var parse_regex = /([^;]+\/[^;]+)(; ?q=(\d\.\d))*/;
	var i = 0;
	var result = null;
	var preferred_mime_types = [];
	var secondary_mime_types = [];

	if (typeof accept == "string") {
		accept = accept.split(",");

		for (i = 0; i < accept.length; i++) {
			result = accept[i].match(parse_regex);
			if (typeof result[3] === "undefined" || result[3] === null) {
				preferred_mime_types[result[1]] = true;
			} else {
				secondary_mime_types.push({media_range : result[1], quality: result[3]});
			}
		}
	}

	return {
		preferred: preferred_mime_types,
		secondary: secondary_mime_types
	};
};