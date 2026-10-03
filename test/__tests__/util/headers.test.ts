import { normalizeHeaders } from '../../../src/util/headers.js';

import { describe, expect, test } from 'vitest';

describe('normalizeHeaders', () => {
	test('lower-cases header names', () => {
		expect(normalizeHeaders({
			'Content-Type': 'text/plain',
			'X-CUSTOM': ['a', 'b'],
			'already-lower': 'yes'
		})).toEqual({
			'content-type': 'text/plain',
			'x-custom': ['a', 'b'],
			'already-lower': 'yes'
		});
	});

	test('merges two string values whose names differ only by case', () => {
		expect(normalizeHeaders({
			vary: 'Origin',
			Vary: 'Accept-Encoding'
		})).toEqual({
			vary: ['Origin', 'Accept-Encoding']
		});
	});

	test('merges string and array values whose names differ only by case', () => {
		expect(normalizeHeaders({
			'set-cookie': 'a=1',
			'Set-Cookie': ['b=2', 'c=3'],
			'SET-COOKIE': 'd=4'
		})).toEqual({
			'set-cookie': ['a=1', 'b=2', 'c=3', 'd=4']
		});
	});

	test('drops headers with an undefined value', () => {
		const normalized = normalizeHeaders({
			'X-Missing': undefined,
			'X-Present': 'yes'
		});

		expect(Object.keys(normalized)).toEqual(['x-present']);
	});

	test('does not modify the headers it is given', () => {
		const cookies = ['a=1'];
		const headers = {
			'Set-Cookie': cookies,
			'set-cookie': 'b=2'
		};

		const normalized = normalizeHeaders(headers);

		expect(headers).toEqual({
			'Set-Cookie': ['a=1'],
			'set-cookie': 'b=2'
		});
		expect(cookies).toEqual(['a=1']);
		expect(normalized['set-cookie']).not.toBe(cookies);
	});
});
