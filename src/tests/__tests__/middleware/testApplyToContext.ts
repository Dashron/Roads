/* eslint-disable @typescript-eslint/no-explicit-any */
import { buildApplyToContextMiddleware } from '../../../middleware/applyToContext';

describe('ApplyToContext tests', () => {
	test('test apply to context applies context', () => {
		expect.assertions(2);
		const key = 'foo';
		const val = 'bar';
		const context: {[x: string]: any} = {};

		const fn = buildApplyToContextMiddleware(key, val);
		expect(typeof(fn)).toEqual('function');

		// eslint-disable-next-line @typescript-eslint/no-empty-function
		fn.call(context, 'a', 'b', 'c', 'd', function () {});

		expect(val).toEqual(context[key]);
	});

	test('test apply to context calls next', () => {
		expect.assertions(2);
		const key = 'foo';
		const val = 'bar';
		const context = {};

		const fn = buildApplyToContextMiddleware(key, val);
		expect(typeof(fn)).toEqual('function');

		const custom = fn.call(context, 'a', 'b', 'c', 'd', function () {
			return 'custom data';
		});

		expect(custom).toEqual('custom data');
	});
});