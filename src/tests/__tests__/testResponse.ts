"use strict";

import { Response } from '../../index';

describe('response tests', () => {
	/**
	 * Test that the constructor fields are accessible by the proper attributes.
	 */
	test('Constructor applies to body', () => {
		expect.assertions(3);
		let response_data = { message : "hello" };
		let headers = {hello: "there"}
		let res = new Response(JSON.stringify(response_data), 200, headers);

		expect(res.body).toEqual(JSON.stringify(response_data));
		expect(res.status).toEqual(200);
		expect(res.headers).toEqual(headers);
	});
});