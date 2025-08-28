/* eslint-disable max-len */
import Response from './response.js';
import { Context } from './road.js';

export interface NextCallback {

	(): Promise<Response | string>
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

		let progress = 0;
		const next: (context: Context, ...args: unknown[]) => Promise<Response | string> = async (context, ...args) => {

			if (this._function_chain.length && progress < this._function_chain.length) {
				const currentFunction = this._function_chain[progress];
				if (currentFunction) {
					return currentFunction.call(context, ...args, () => {
						progress += 1;
						return next(context, ...args);
					});
				}
			}

			// If next is called and there is nothing next, we should still return a promise,
			//		it just shouldn't do anything
			return new Response('Page not found', 404);
		};

		return next;
	}
}