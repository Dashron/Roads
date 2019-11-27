"use strict";

import Road from '../../../road';
import url_module from 'url';
import Response from '../../../response';

// Note: This file used to have many more tests, but a recent roads change invalidated most of them, and the migration to jest made it clear that many of them were 
// covered by other tests (context, multi use, etc)
describe('road buildNext test', () => {
	/**
	 * Test buildNext success when a route does not have an onRequest handler
	 */
	test('build next hits', () => {
		expect.assertions(1);

		var road = new Road();
		return expect(road['_buildNext']('GET', '/', '', {}, {request: function(){}, Response: Response})()).resolves.toEqual(new Response('Page not found', 404, {}));
	});
});