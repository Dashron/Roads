/**
 * setTitle.js
 * Copyright(c) 2020 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Exposes a single middleware function to help manage the page title. This is best used alongside the PJAX helper
 */
import { Middleware } from '../core/road';
/**
 * Adds two simple functions to get and set a page title on the request context. This is very helpful for isomorphic js, since on the client, page titles aren't part of the rendered view data.
 */
declare let setTitle: Middleware;
export default setTitle;
