"use strict";
/**
* addLayout.js
* Copyright(c) 2017 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

function wrapLayout(body, title, ignore_layout) {
	if (ignore_layout) {
		return body;
	}
	
	return '<!DOCTYPE html>\
<html>\
<head><title>' + title + '</title></head>\
<body>\
	<div id="container">' + body +
'	<script src="/client.brws.js"></script>\
    </div>\
</body>\
</html>';
}


module.exports = function (method, url, body, headers, next) {
	var _self = this;
	
	return next()
		.then(function (response) {
			response.body = wrapLayout(response.body, _self._page_title ? _self._page_title : '', _self.method_context ? _self.method_context.ignore_layout : false);
			return response;
		});
};