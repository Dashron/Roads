export { default as Response } from './core/response';
export { default as Road } from './core/road';
export { default as RoadsPJAX } from './client/pjax';
export { default as Request } from './client/request';
import applyToContext from './middleware/applyToContext';
import cors from './middleware/cors';
import reroute from './middleware/reroute';
import SimpleRouter from './middleware/simpleRouter';
declare const Middleware: {
    applyToContext: typeof applyToContext;
    cookie: import("./core/road").Middleware<import("./middleware/cookie").CookieMiddleware>;
    cors: typeof cors;
    killSlash: import("./core/road").Middleware<import("./core/road").Context>;
    parseBody: import("./core/road").Middleware<import("./core/road").Context>;
    reroute: typeof reroute;
    storeVals: import("./core/road").Middleware<import("./middleware/storeVals").StoreValsContext>;
    SimpleRouter: typeof SimpleRouter;
};
export { Middleware };
