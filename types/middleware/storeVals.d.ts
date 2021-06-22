/**
 * storeVals.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Exposes two functions on the context that allow you to store and retrieve values.
 * 	You can of course apply values directly to the context, but this is useful
 * 	to reduce polluting the context
 */
import { Context, Middleware } from '../core/road';
export interface StoreValsContext extends Context {
    /**
     * Stores a value
     * @param field string
     * @param val unknown
     */
    storeVal: (field: string, val: unknown) => void;
    /**
     * Retrieves a value
     * @param field string
     */
    getVal: (field: string) => unknown;
    /**
     * Retrieves all values
     */
    getAllVals: () => {
        [key: string]: unknown;
    };
}
/**
 * Exposes two functions on the context that allow you to store and retrieve values.
 * 	You can of course apply values directly to the context, but this is useful
 * 	to reduce polluting the context
 */
export declare const middleware: Middleware<StoreValsContext>;
