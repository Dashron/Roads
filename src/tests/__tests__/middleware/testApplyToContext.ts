"use strict";

import * as Middleware from '../../../middleware';
let applyToContext = Middleware.applyToContext;

describe('ApplyToContext tests', () => {
	test('test apply to context applies context', () => {
		expect.assertions(2);
		var key = 'foo';
		var val = 'bar';
		var context: {[x: string]: any} = {};

		var fn = applyToContext(key, val);
		expect(typeof(fn)).toEqual('function');

		fn.call(context, 'a', 'b', 'c', 'd', function () {});

		expect(val).toEqual(context[key]);
	});

	test('test apply to context calls next', () => {
		expect.assertions(2);
		var key = 'foo';
		var val = 'bar';
		var context = {};
	
		var fn = applyToContext(key, val);
		expect(typeof(fn)).toEqual('function');
	
		var custom = fn.call(context, 'a', 'b', 'c', 'd', function () {
			return 'custom data';
		});
	
		expect(custom).toEqual('custom data');
	});
});