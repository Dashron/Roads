import Road from './core/road.js';

export { default as Response } from './core/response.js';
export { default as Road } from './core/road.js';
export * as RoadModule from './core/road.js';
export { default as RoadsPJAX } from './client/pjax.js';
export { default as Request } from './client/request.js';

export * as ApplyToContextMiddleware from './middleware/applyToContext.js';
// This is not part of the common middleware because it uses different middleware depending on client or server
export * as CookieMiddleware from './middleware/cookieMiddleware.js';
// This is not part of the common middleware because it requires configuration
export * as CorsMiddleware from './middleware/cors.js';
export * as RemoveTrailingSlashMiddleware from './middleware/removeTrailingSlash.js';
import * as RemoveTrailingSlashMiddleware from './middleware/removeTrailingSlash.js';
export * as ParseBodyMiddleware from './middleware/parseBody.js';
import * as ParseBodyMiddleware from './middleware/parseBody.js';
// This is not part of the common middleware because it requires configuration
export * as RerouteMiddleware from './middleware/reroute.js';
export * as StoreValsMiddleware from './middleware/storeVals.js';
import * as StoreValsMiddleware from './middleware/storeVals.js';
export * as ModifiedSinceMiddleware from './middleware/modifiedSince.js';
import * as ModifiedSinceMiddleware from './middleware/modifiedSince.js';
// This is not part of the common middleware because it requires configuration,
//  and should happen after all user-provided middleware
export * as RouterMiddleware from './middleware/router.js';

export function attachCommonMiddleware(road: Road) {
	road.use(RemoveTrailingSlashMiddleware.middleware);
	road.use(StoreValsMiddleware.middleware);
	road.use(ParseBodyMiddleware.middleware);
	road.use(ModifiedSinceMiddleware.middleware);
}
