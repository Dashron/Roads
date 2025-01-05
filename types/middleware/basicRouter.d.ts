/**
 * basicRouter.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This is a basic router middleware for roads.
 * 	It allows you to easily attach functionality to HTTP methods and paths.
 */
import * as url_module from 'url';
import { IncomingHeaders, NextCallback } from '../core/road';
import Road, { Context } from '../core/road';
import Response from '../core/response';
export interface Route<ContextType extends Context> {
    (this: ContextType, path: BasicRouterURL, body: string, headers: IncomingHeaders, next: NextCallback): Promise<Response>;
}
interface RouteDetails {
    route: Route<Context>;
    path: string;
    method: string;
}
export interface BasicRouterURL extends url_module.UrlWithParsedQuery {
    args?: Record<string, string | number>;
}
/**
 * This is a basic router middleware for roads.
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
 * @name BasicRouter
 */
export declare class BasicRouter {
    protected _routes: RouteDetails[];
    /**
     * @param {Road} [road] - The road that will receive the BasicRouter middleware
     */
    constructor(road?: Road);
    /**
     * If you don't provide a road to the SimpleRouter constructor, your routes will not be executed.
     * 	If you have reason not to assign the road off the bat, you can assign it later with this function.
     *
     * @param  {Road} road - The road that will receive the BasicRouter middleware
     */
    applyMiddleware(road: Road): void;
    /**
     * This is where you want to write the majority of your webservice. The `fn` parameter should contain
     * 	the actions you want to perform when a certain `path` and HTTP `method` are accessed via the `road` object.
     *
     * The path supports a very basic templating system. The values inbetween each slash can be interpreted
     * 	in one of three ways
     *  - If a path part starts with a #, it is assumed to be a numeric variable. Non-numbers will not match this route
     *  - If a path part starts with a $, it is considered to be an alphanumeric variabe. All non-slash values
     * 		will match this route.
     *  - If a path starts with anything but a # or a $, it is assumed to be a literal. Only that value will match
     * 		this route.
     *
     * 		e.g. /users/#userId will match /users/12345, not /users/abcde. If a request is made to /users/12345 the
     * 			route's requestUrl object will include the key value pair of `args: { userId: 12345 }`
     * Any variables will be added to the route's request url object under the "args" object.
     *
     *
     * @param {string} method - The HTTP method that will trigger the provided function
     * @param {(string|array)} paths - One or many URL paths that will trigger the provided function
     * @param {function} fn - The function containing all of your route logic
     */
    addRoute<ContextType extends Context>(method: string, paths: string | string[], fn: Route<ContextType>): void;
    /**
     * Add an entire file worth of routes.
     *
     * The file should be a node module that exposes an object.
     * Each key should be an HTTP path, each value should be an object.
     * In that object, each key should be an HTTP method, and the value should be your route function.
     *
     * @param {string} filePath - The file path
     * @param {string} [prefix] - A string that will help namespace this file. e.g. if you call this on a file
     * 		with a route of "/posts", and the prefix "/users", the route will be assigned to "/users/posts"
     */
    addRouteFile(filePath: string, prefix?: string): Promise<void>;
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
//# sourceMappingURL=basicRouter.d.ts.map