import { middleware, StoreValsContext } from '../../../src/middleware/storeVals.js';

import { describe, expect, test } from 'vitest';

describe('Store Values', () => {

	test('test storeVal and getVal functions are properly applied to middleware', () => {
		expect.assertions(2);

		const context = {} as StoreValsContext;


		middleware.call(context, 'a', 'b', 'c', {}, function () { return Promise.resolve(''); });

		expect(typeof(context.storeVal)).toEqual('function');
		expect(typeof(context.getVal)).toEqual('function');
	});

	/**
	 * Test that the title is properly set to the request context
	 */
	test('test storeVal and getVal work as expected', () => {
		expect.assertions(1);

		const context = {} as StoreValsContext;


		middleware.call(context, 'a', 'b', 'c', {}, function () { return Promise.resolve(''); });
		context.storeVal('foo', 'bar');

		expect(context.getVal('foo')).toEqual('bar');
	});

	test.each(['constructor', 'toString', 'hasOwnProperty', '__proto__'])(
		'test getVal does not return the inherited %s', (field) => {
			const context = {} as StoreValsContext;
			middleware.call(context, 'a', 'b', 'c', {}, function () { return Promise.resolve(''); });

			expect(context.getVal(field)).toBeUndefined();
		});

	test('test __proto__ is stored as an ordinary value', () => {
		const context = {} as StoreValsContext;
		middleware.call(context, 'a', 'b', 'c', {}, function () { return Promise.resolve(''); });

		context.storeVal('__proto__', { polluted: true });

		expect(context.getVal('__proto__')).toEqual({ polluted: true });
		expect(context.getVal('polluted')).toBeUndefined();
		expect(Object.keys(context.getAllVals())).toEqual(['__proto__']);
	});

	test('test getAllVals returns only stored values', () => {
		const context = {} as StoreValsContext;
		middleware.call(context, 'a', 'b', 'c', {}, function () { return Promise.resolve(''); });

		context.storeVal('page-title', 'Home');

		expect({ ...context.getAllVals() }).toEqual({ 'page-title': 'Home' });
	});
});