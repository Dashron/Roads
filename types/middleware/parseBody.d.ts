/**
 * parseBody.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Exposes a single middleware function to help parse request bodies
 */
import { Context, Middleware } from '../core/road';
export interface ParseBodyContext<BodyType> extends Context {
    body: BodyType;
}
/**
 * Attempts the parse the request body into a useful object
 */
export declare const parseBodyMiddleware: Middleware<Context>;
