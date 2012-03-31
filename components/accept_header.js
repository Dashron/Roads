/*
* gfw.js - config.js
* Copyright(c) 2011 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
*/
"use strict";

/**
 * [getRenderMode description]
 * @param  {[type]} request         [description]
 * @param  {[type]} available_modes [description]
 * @return {[type]}                 [description]
 */
exports.getRenderMode = function (accept, available_modes) {
	var mime_types = parseAcceptHeader(accept);
	var i = 0;
	var j = 0;
	var highest_quality = -1;
	var mode_index = -1;
	
	for (i = 0; i < available_modes.length; i++) {
		if (mime_types.preferred[available_modes[i]] === true) {
			return available_modes[i];
		}
	}

	for (i = 0; i < available_modes.length; i++) {
		if (mime_types.secondary[j].media_range === available_modes[i]) {
			if (highest_quality < mime_types.secondary[j].quality) {
				highest_quality = mime_types.secondary[j].quality;
				mode_index = i;
			}
		}
	}

	if (typeof available_modes[mode_index] != "undefined" && available_modes[mode_index] != null) {
		return available_modes[mode_index];
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