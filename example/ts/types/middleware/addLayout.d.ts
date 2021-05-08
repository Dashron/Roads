/**
 * addLayout.js
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This file is an example of how to apply HTML layouts via a middleware system
 */
import { Context, Middleware } from 'roads/types/core/road';
/**
 * This middleware wraps the response in a standard HTML layout. It looks for three fields in the request context.
 * - _page_title - The title of the page
 * - ignore_layout - If true, this middleware will not apply the layout (useful for JSON responses)
 *
 * @param {string} method - HTTP request method
 * @param {string} url - HTTP request url
 * @param {string} body - HTTP request body
 * @param {object} headers - HTTP request headers
 * @param {function} next - When called, this function will execute the next step in the roads method chain
 */
declare const addLayoutMiddleware: Middleware<Context>;
export default addLayoutMiddleware;
