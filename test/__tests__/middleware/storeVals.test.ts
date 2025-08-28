/* eslint-disable @typescript-eslint/no-explicit-any */
import { middleware } from '../../../src/middleware/storeVals';

import { describe, expect, test } from 'vitest';

describe('Store Values', () => {

	test('test storeVal and getVal functions are properly applied to middleware', () => {
		expect.assertions(2);

		const context: Record<string, any> = {};


		middleware.call(context, 'a', 'b', 'c', {}, function () {});

		expect(typeof(context.storeVal)).toEqual('function');
		expect(typeof(context.getVal)).toEqual('function');
	});

	/**
	 * Test that the title is properly set to the request context
	 */
	test('test storeVal and getVal work as expected', () => {
		expect.assertions(1);

		const context: Record<string, any> = {};


		middleware.call(context, 'a', 'b', 'c', {}, function () {});
		context.storeVal('foo', 'bar');

		expect(context.getVal('foo')).toEqual('bar');
	});
});