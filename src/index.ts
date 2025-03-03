import Road, { Context } from './core/road';

export { default as Response } from './core/response';
export { default as Road } from './core/road';
export { default as RoadsPJAX } from './client/pjax';
export { default as Request } from './client/request';

export * as ApplyToContextMiddleware from './middleware/applyToContext';
// This is not part of the common middleware because it uses different middleware depending on client or server
export * as CookieMiddleware from './middleware/cookieMiddleware';
// This is not part of the common middleware because it requires configuration
export * as CorsMiddleware from './middleware/cors';
export * as RemoveTrailingSlashMiddleware from './middleware/removeTrailingSlash';
import * as RemoveTrailingSlashMiddleware from './middleware/removeTrailingSlash';
export * as ParseBodyMiddleware from './middleware/parseBody';
import * as ParseBodyMiddleware from './middleware/parseBody';
// This is not part of the common middleware because it requires configuration
export * as RerouteMiddleware from './middleware/reroute';
export * as StoreValsMiddleware from './middleware/storeVals';
import * as StoreValsMiddleware from './middleware/storeVals';
export * as ModifiedSinceMiddleware from './middleware/modifiedSince';
import * as ModifiedSinceMiddleware from './middleware/modifiedSince';
// This is not part of the common middleware because it requires configuration,
//  and should happen after all user-provided middleware
export * as RouterMiddleware from './core/router';

export function attachCommonMiddleware<
	MiddlewareContext extends Context & StoreValsMiddleware.StoreValsContext & ModifiedSinceMiddleware.ModifiedSinceContext
>(road: Road<MiddlewareContext>) {
	road.beforeRoute(RemoveTrailingSlashMiddleware.middleware);
	road.beforeRoute(StoreValsMiddleware.middleware);
	road.beforeRoute(ParseBodyMiddleware.middleware);
	road.beforeRoute(ModifiedSinceMiddleware.middleware);
}
