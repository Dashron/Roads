var vows = require('vows');
var assert = require('assert');

var Cookie = require('../../components/cookie').Cookie;

vows.describe('Model Component').addBatch({
	'A cookie with cookie headers': {
		topic: function () {
			var cookies = new Cookie({
				headers : {
					cookie : 'a=b; c=d'
				}
			}, {
				// response
			});
			return cookies;
		},
		'can read existing headers': function (cookie) {
			assert.equal(cookie.get('a'), 'b');
			assert.equal(cookie.get('c'), 'd');
		},
	},
	'A response with cookies': {
		topic: function () {
			var response = {
				headers : {},
				setHeader : function (key, value) {
					this.headers[key] = value;
				},
				getHeader : function (key) {
					return this.headers[key];
				}
			};

			var cookies = new Cookie({
				headers : {
					cookie : {}
				}
			}, response);

			cookies.set('a', {
				value : 'b'
			});

			cookies.set('c', {
				value : 'd'
			});

			cookies.delete('e');

			return response;
		},
		'has set values properly' : function (response) {
			var headers = response.getHeader('Set-Cookie');

			assert.equal(headers[0], 'a=b; Path=/');
			assert.equal(headers[1], 'c=d; Path=/');
			// todo: test expires, domain, path, secure, httponly
		},
		'has deleted values properly' : function (response) {
			var headers = response.getHeader('Set-Cookie');
			assert.equal(headers[2], 'e=1; Path=/; Expires=' + (new Date(0)).toString());
		}
	}
}).export(module); // Export the Suite