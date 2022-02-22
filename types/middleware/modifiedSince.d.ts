/**
 * modifiedSince.ts
 * Copyright(c) 2022 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This file exposes middleware that helps manage the if-modified-since caching headers
 */
import { Context, Middleware } from '../core/road';
import Response from '../core/response';
export interface ModifiedSinceContext extends Context {
    shouldReturnNotModifiedResponse: (lastModifiedTime: string | Date) => boolean;
    buildNotModifiedResponse: () => Response;
}
export declare const middleware: Middleware<ModifiedSinceContext>;
