/**
 * parseBody.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Exposes a single middleware function to help parse request bodies
 */
import { Context, Middleware } from '../core/road';
/**
 * Attempts the parse the request body into a useful object
 */
declare const parseBody: Middleware<Context>;
export default parseBody;
