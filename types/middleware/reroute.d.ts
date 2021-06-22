/**
 * reroute.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Applies a method to the request context that allows you to make requests into another roads object.
 * This is useful when you're running two servers locally. One example is a webserver and a separate API server.
 */
import { Context, Middleware } from '../core/road';
import Road from '../core/road';
/**
 * Applies a method to the request context that allows you to make requests into another roads object.
 * This is useful when you're running two servers locally. One example is a webserver and a separate API server.
 *
 * TODO: Should this just use applytocontext?
 *
 * @param {string} key - The name of the key in the request context that will store the roads request.
 * @param  {road} road - The roads object that you will interact with.
 * @return {function} The middleware function. This value should be passed to road.use(fn);
 */
export declare function build(key: string, road: Road): Middleware<Context>;
