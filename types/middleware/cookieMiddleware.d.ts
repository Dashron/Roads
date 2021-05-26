/**
 * cookie.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Exposes a single middleware function to help with cookies
 */
/**
 * Middleware to make it easier for roads to work with cookies.
 *
 * Any parsed cookies from the request header are added as key value pairs on the
 * request context under the "cookie" property.
 *
 * If you want to set new cookies, helper methods have been added onto the request context's
 * Response object. If you create a new Response object using new this.Response, it will receive
 * a `setCookie` method for updating cookies, and a `getCookieHeader` method for retrieval.
 *
 * The `setCookie` method uses the [cookie module[(https://github.com/jshttp/cookie). This module
 * accepts the following cookie options
 *
 * - path
 * - expires
 * - maxAge
 * - domain
 * - secure
 * - httpOnly
 * - firstPartyOnly
 *
 */
import * as cookie from 'cookie';
import { Context, Middleware } from '../core/road';
export interface CookieContext extends Context {
    setCookie: (name: string, value?: string, options?: cookie.CookieSerializeOptions) => void;
    getCookies: () => {
        [x: string]: string;
    };
    newCookies: NewCookies;
}
interface NewCookies {
    [key: string]: {
        value: string;
        options: cookie.CookieSerializeOptions;
    };
}
export declare const cookieMiddleware: Middleware<CookieContext>;
export declare const clientCookieMiddleware: (pageDocument: Document) => Middleware<CookieContext>;
export {};
