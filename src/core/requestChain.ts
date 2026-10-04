/* eslint-disable max-len */
import Response from './response.js';
import { Context } from './road.js';

/**
 * Values that a function in the chain can change for every function after it.
 * 	Anything left out is passed along unchanged.
 */
export interface NextOverrides {
	method?: string,
	body?: unknown
}

export interface NextCallback {

	(overrides?: NextOverrides): Promise<Response | string>
}

// eslint-disable-next-line
export class RequestChain<fn extends Function> {
	/**
	 * The request chain is an array of functions that are executed in order when `run` is called
	 */
	protected _function_chain: fn[];

	/**
	 * RequestChain Constructor
	 *
	 * Creates a new RequestChain object
	 */
	constructor (initial?: fn[]) {
		this._function_chain = initial || [];
	}

	add (fn: fn) {
		this._function_chain.push(fn);
	}

	length () {
		return this._function_chain.length;
	}

	/**
	 * The `run` function is used to execute the function chain.
	 *
	 * The function chain is executed in order, with each function in the chain being called with the parameters provided to the function.
	 *
	 * The function function returns a Promise that resolves to a Response object or a string.
	 *
	 */
	getChainStart () {

		// Each step is given its own index, so the next callback handed to a function always runs the
		//		function after it, no matter how many times it is called
		const run = async (index: number, context: Context, ...args: unknown[]): Promise<Response | string> => {
			const currentFunction = this._function_chain[index];

			if (currentFunction) {
				return currentFunction.call(context, ...args, (overrides?: NextOverrides) => {
					if (!overrides) {
						return run(index + 1, context, ...args);
					}

					// The method is always the first argument of the chain, and the body is always the third
					const newArgs = [...args];

					if (overrides.method) {
						newArgs[0] = overrides.method;
					}

					// We check for the key so the body can be replaced with an empty string or undefined
					if ('body' in overrides) {
						newArgs[2] = overrides.body;
					}

					return run(index + 1, context, ...newArgs);
				});
			}

			// If next is called and there is nothing next, we should still return a promise,
			//		it just shouldn't do anything
			return new Response('Page not found', 404);
		};

		return (context: Context, ...args: unknown[]) => run(0, context, ...args);
	}
}