/**
 * cookie.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Middleware for managing cookies
 */
import * as cookie from 'cookie';
import { Context, Middleware } from '../core/road';
/**
 * The Cookie Context represents the request context when either the
 * 	server or client middleware are used. This context includes two functions.
 *
 * When you're using typescript you can pass this context to one of
 * 	the middleware or route's generics to get proper typing on the request context.
 *
 * See the readme for examples.
 */
export interface CookieContext extends Context {
    /**
     * Calling this function will store your new cookies.
     * 	The parameters directly map to the [cookie](https://github.com/jshttp/cookie) module.
     */
    setCookie: (name: string, value?: string, options?: cookie.CookieSerializeOptions) => void;
    /**
     * Returns an object with all the cookies. It defaults to
     * 	all the request cookies, but merges anything applied via
     * 	setCookie on top (i.e. setCookie will override the request cookie)
     */
    getCookies: () => Record<string, string>;
    newCookies: NewCookies;
}
interface NewCookies {
    [key: string]: {
        value: string;
        options: cookie.CookieSerializeOptions;
    };
}
/**
 * Middleware to attach to your road via `road.use`.
 * 	This middleware will add any new cookies to the response object
 * 	and thus is most useful server-side
 *
 * @param route_method
 * @param route_path
 * @param route_body
 * @param route_headers
 * @param next
 * @returns
 */
export declare const serverMiddleware: Middleware<CookieContext>;
/**
 * Creates a middleware function to attach to your road via `road.use`.
 * 	This middleware will add the cookie to document.cookie,
 * 	so it's most useful to be used client side
 *
 * @param pageDocument The pages Document object
 * @returns Middleware
 */
export declare const buildClientMiddleware: (pageDocument: Document) => Middleware<CookieContext>;
export {};
//# sourceMappingURL=cookieMiddleware.d.ts.map