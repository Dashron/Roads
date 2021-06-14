/**
 * storeVals.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Exposes a single middleware function to help manage the page title. This is best used alongside the PJAX helper
 */
import { Context, Middleware } from '../core/road';
export declare const TITLE_KEY = "pjax-page-title";
export interface StoreValsContext extends Context {
    storeVal: (field: string, val: unknown) => void;
    getVal: (field: string) => unknown;
    getAllVals: () => {
        [key: string]: unknown;
    };
}
/**
 * Adds two simple functions to get and set a page title on the request context. This is very helpful for
 * 		isomorphic js, since on the client, page titles aren't part of the rendered view data.
 *  todo: Should we ask for the valid key:data type pairings be sent via a generic to storevalscontext?
 * 		This would be nice for stricter typing
 */
export declare const middleware: Middleware<StoreValsContext>;
