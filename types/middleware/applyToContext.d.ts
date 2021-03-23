/**
 * applyToContext.js
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Exposes a single function to be used with roads middleware. It makes it easy to assign
 * static values to a roads context.
 */
import { Middleware } from '../core/road';
/**
 * Very simple middleware to apply a single value to the request context.
 *
 * @param {string} key - The key that should store the value on the request context.
 * @param {any} val - The value to apply to the request context.
 * @returns {Middleware} The middleware function to apply to the road.use(fn) method.
 */
export default function applyToContext(key: string, val: unknown): Middleware;
