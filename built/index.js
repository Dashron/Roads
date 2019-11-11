"use strict";
/**
 * index.js
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Exposes all of the core components of the Roads library
 */
import { Response } from './response.js';
import * as Road from './road.js';
import * as PJAX from './client/pjax.js';
import * as Client from './client/request.js';
import * as ApplyToContext from './middleware/applyToContext.js';
import * as Cookie from './middleware/cookie.js';
import * as KillSlash from './middleware/killSlash.js';
import * as Reroute from './middleware/reroute.js';
import * as SetTitle from './middleware/setTitle.js';
import * as SimpleRouter from './middleware/simpleRouter.js';
import * as ParseBody from './middleware/parseBody.js';
let data = {
    Promise: Promise,
    Response: Response,
    Road: Road,
    PJAX: PJAX,
    Client: Client,
    middleware: {
        applyToContext: ApplyToContext,
        // this is done to reduce browserify errors. we don't need to call this on page load for broserify
        cors: (options) => {
            return import('./middleware/cors.js').then(CORS => CORS()(options));
        },
        cookie: Cookie,
        killSlash: KillSlash,
        reroute: Reroute,
        setTitle: SetTitle,
        SimpleRouter: SimpleRouter,
        parseBody: ParseBody
    },
    build: function (input_file, output_file, options) {
        return import('./client/build.js').then(build => build(input_file, output_file, options));
    }
};
export default data;
