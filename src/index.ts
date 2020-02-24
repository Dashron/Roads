export { default as Response } from './core/response';
export { default as Road } from './core/road';
export { default as RoadsPJAX } from './client/pjax';
export { default as Request } from './client/request';
export { default as build } from './client/build';

import applyToContext from './middleware/applyToContext';
import cookie from './middleware/cookie';
import cors from './middleware/cors';
import killSlash from './middleware/killSlash';
import parseBody from './middleware/parseBody';
import reroute from './middleware/reroute';
import setTitle from './middleware/setTitle';
import SimpleRouter from './middleware/simpleRouter';


let Middleware = {
    applyToContext: applyToContext,
    cookie: cookie,
    cors: cors,
    killSlash: killSlash,
    parseBody: parseBody,
    reroute: reroute,
    setTitle: setTitle,
    SimpleRouter: SimpleRouter
};

export { Middleware };