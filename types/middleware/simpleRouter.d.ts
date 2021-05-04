/**
 * simpleRouter.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Exposes the SimpleRouter class to be used with roads middleware.
 */
/// <reference types="node" />
import * as url_module from 'url';
import { IncomingHeaders, NextCallback } from '../core/road';
import Road, { Context } from '../core/road';
import Response from '../core/response';
export interface Route {
    (this: Context, path: SimpleRouterURL, body: string, headers: IncomingHeaders, next: NextCallback): Promise<Response>;
}
interface RouteDetails {
    route: Route;
    path: string;
    method: string;
}
export interface SimpleRouterURL extends url_module.UrlWithParsedQuery {
    args?: {
        [x: string]: string | number;
    };
}
/**
 * This is a simple router middleware for roads.
 * You can assign functions to url paths, and those paths can have some very basic variable templating
 *
 * Templating is basic. Each URI is considered to be a series of "path parts" separated by slashes.
 * If a path part starts with a #, it is assumed to be a numeric variable. Non-numbers will not match this route
 * If a path part starts with a $, it is considered to be an alphanumeric variabe.
 * 		All non-slash values will match this route.
 *
 * Any variables will be added to the route's request url object under the "args" object.
 *
 * e.g.
 * /users/#user_id will match /users/12345, not /users/abcde. If a request is made to /users/12345
 * 	 the route's requestUrl object will contain { args: {user_id: 12345}} along with all other url object values
 *
 * @name SimpleRouter
 */
export default class SimpleRouter {
    protected _routes: RouteDetails[];
    /**
     * @param {Road} [road] - The road that will receive the SimpleRouter middleware
     */
    constructor(road?: Road);
    /**
     * Assigns the middleware to the provided road
     *
     * @param  {Road} road - The road that will receive the SimpleRouter middleware
     */
    applyMiddleware(road: Road): void;
    /**
     * Adds a route to this router. The route is a function that will match the standard roads request signature.
     * It will be associated with one HTTP method, and one or many HTTP paths
     *
     * @param {string} method - The HTTP method that will trigger the provided function
     * @param {(string|array)} paths - One or many URL paths that will trigger the provided function
     * @param {function} fn - The function containing all of your route logic
     */
    addRoute(method: string, paths: string | string[], fn: Route): void;
    /**
     * Add an entire file worth of routes.
     *
     * The file should be a node module that exposes an object.
     * Each key should be an HTTP path, each value should be an object.
     * In that object, each key should be an HTTP method, and the value should be your route function.
     *
     * @param {string} file_path - The file path
     * @param {string} [prefix] - A string that will help namespace this file. e.g. if you call this on a file
     * 		with a route of "/posts", and the prefix "/users", the route will be assigned to "/users/posts"
     */
    addRouteFile(file_path: string, prefix?: string): Promise<void>;
    /**
     * Slightly non-standard roads middleware to execute the functions in this router when requests are received by the road
     * The first method is the routes to ensure that we can properly use this router once we loose the "this" value
     * from the roads context
     *
     * @todo there might be a better way to do this
     */
    protected _middleware(routes: RouteDetails[], request_method: string, request_url: string, request_body: string, request_headers: IncomingHeaders, next: NextCallback): Promise<Response | string>;
}
export {};
