import { Middleware } from '../../../index';
const setTitle = Middleware.setTitle;


describe('Set Title', () => {
	/**
	 * Test that the setTitle function is properly applied by the setTitle middlware
	 */
	test('test setTitle function is properly applied to middleware', () => {
		expect.assertions(2);

		const context: {[x: string]: any} = {};

		expect(typeof(setTitle)).toEqual('function');

		// eslint-disable-next-line @typescript-eslint/no-empty-function
		setTitle.call(context, 'a', 'b', 'c', {}, function () {});

		expect(typeof(context.setTitle)).toEqual('function');
	});

	/**
	 * Test that the title is properly set to the request context
	 */
	test('test setTitle function properly updates request context', () => {
		expect.assertions(2);

		const context: {[x: string]: any} = {};

		expect(typeof(setTitle)).toEqual('function');

		// eslint-disable-next-line @typescript-eslint/no-empty-function
		setTitle.call(context, 'a', 'b', 'c', {}, function () {});
		context.setTitle('foo');

		expect(context._page_title).toEqual('foo');
	});
});