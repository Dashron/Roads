import { Road } from '../../../src/index';

import { describe, expect, test } from 'vitest';

describe('road use', () => {
	/**
	 * Test that the use function returns itself for viable chaining
	 */
	test('Use Returns Self', () => {
		expect.assertions(1);

		const road = new Road();

		expect(road.use(function (method, path, body, headers, next) {
			return next();
		})).toEqual(road);

	});
});