export { default as Response } from './core/response';
export { default as Road } from './core/road';
export { default as RoadsPJAX } from './client/pjax';
export { default as Request } from './client/request';

import applyToContext from './middleware/applyToContext';
import cookie from './middleware/cookie';
import cors from './middleware/cors';
import killSlash from './middleware/killSlash';
import parseBody from './middleware/parseBody';
import reroute from './middleware/reroute';
import storeVals from './middleware/storeVals';
import SimpleRouter from './middleware/simpleRouter';


const Middleware = {
	applyToContext,
	cookie,
	cors,
	killSlash,
	parseBody,
	reroute,
	storeVals,
	SimpleRouter
};

export { Middleware };