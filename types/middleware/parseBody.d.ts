/**
 * parseBody.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Exposes a single middleware function to help parse request bodies
 */
import { Context, Middleware } from '../core/road';
/**
 * When using typescript you can pass this when adding middleware or
 * 	routes to see proper typing on `this`.
 *
 * This context specifically adds one variable `body` which will match
 * 	the structure passed to `BodyType`.
 */
export interface ParseBodyContext<BodyType> extends Context {
    body?: BodyType;
}
/**
 * Attempts the parse the request body into a useful object
 */
export declare const middleware: Middleware<Context>;
