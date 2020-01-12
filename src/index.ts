export { default as Response } from './response';
export { default as Road } from './road';
export { default as build } from './client/build';
export { default as RoadsPjax } from './client/pjax';
export { default as Request } from './client/request';

import { default as _applyToContext } from './middleware/applyToContext'
import { default as _cookie } from './middleware/cookie';
import { default as _cors }from './middleware/cors';
import { default as _killSlash } from './middleware/killSlash';
import { default as _parseBody } from './middleware/parseBody';
import { default as _reroute } from './middleware/reroute';
import { default as _setTitle } from './middleware/setTitle';
import { default as _simpleRouter } from './middleware/simpleRouter';

export const Middleware = {
    applyToContext: _applyToContext,
    cookie: _cookie,
    cors: _cors,
    killSlash: _killSlash,
    parseBody: _parseBody,
    reroute: _reroute,
    setTitle: _setTitle,
    SimpleRouter: _simpleRouter
}

