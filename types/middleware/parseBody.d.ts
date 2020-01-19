/**
 * parseBody.js
 * Copyright(c) 2020 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Exposes a single middleware function to help parse request bodies
 */
import { Middleware } from '../core/road';
/**
 * Attempts the parse the request body into a useful object
 */
declare let parseBody: Middleware;
export default parseBody;
