/**
 * storeVals.ts
 * Copyright(c) 2025 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Exposes two functions on the context that allow you to store and retrieve values.
 * 	You can of course apply values directly to the context, but this is useful
 * 	to reduce polluting the context
 */

import { Route } from '../core/router';
import { Context } from '../core/road';

export interface StoreValsContext extends Context {
	/**
	 * Stores a value
	 * @param field string
	 * @param val unknown
	 */
	storeVal: (field: string, val: unknown) => void,
	/**
	 * Retrieves a value
	 * @param field string
	 */
	getVal: (field: string) => unknown,
	/**
	 * Retrieves all values
	 */
	getAllVals: () => Record<string, unknown>
}

/**
 * Exposes two functions on the context that allow you to store and retrieve values.
 * 	You can of course apply values directly to the context, but this is useful
 * 	to reduce polluting the context
 */
export const middleware: Route<StoreValsContext> = function (method, path, body, headers, next) {
	const storedVals: {[key: string]: unknown} = {};

	this.storeVal = (field, val) => {
		storedVals[field] = val;
	};

	this.getVal = (field) => {
		return storedVals[field];
	};

	this.getAllVals = () => {
		return storedVals;
	};

	return next();
};