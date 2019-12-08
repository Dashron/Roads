/**
 * reroute.js
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Exposes a method that allows you to bind additional roads to a road context. This allows you to manage multiple
 * client side or server side road objects at once
 */
import { Middleware } from '../road';
import Road from '../road';
/**
 * Applies a method to the request context that allows you to make requests into another roads object
 *
 * @param {string} key - The name of the key in the request context that will store the roads request.
 * @param  {road} road - The roads object that you will interact with.
 * @return {function} The middleware function. This value should be passed to road.use(fn);
 */
export default function (key: string, road: Road): Middleware;
