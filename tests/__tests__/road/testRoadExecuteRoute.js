"use strict";

var roads = require('../../../src/index.js');
var url_module = require('url');

describe('Execute Route', () => {
	/**
	 * Test that route execution of a normal function becomes a proper promise
	 */
	test('Execute Route', () => {
		expect.assertions(1);
		var road = new roads.Road();
		var result = 'all the things';

		return expect(road._executeRoute(function () {
			return result;
		})).resolves.toEqual(result);
	});

	/**
	 * Test that route execution of a normal function, which throws an exception, becomes a proper promise
	 */
	test('Execute Error Route', () => {
		expect.assertions(1);
		var road = new roads.Road();
		var err = new Error();

		return expect(road._executeRoute(function () {
			throw err;
		})).rejects.toEqual(err);
	});

	/**
	 * Test that route execution of an async function becomes a proper promise
	 */
	test('Execute Async Route', () => {
		expect.assertions(1);
		var road = new roads.Road();
		var result = 'stuff stuff stuff';

		// todo: eventually switch to async functions
		expect(road._executeRoute(async function () {
			return result;
		})).resolves.toEqual(result);
	});

	/**
	 * Test that route execution of an async function, which throws an exception, becomes a proper promise
	 */
	test('Execute Error Async Route', () => {
		expect.assertions(1);
		var road = new roads.Road();

		// todo: eventually switch to async functions
		var cr = async function () {
			throw new Error('random messageeeeeeeeeee');
			await new roads.Promise(function (resolve) { resolve() });
		};

		return expect(road._executeRoute(cr)).rejects.toEqual(new Error('random messageeeeeeeeeee'));
	});
});