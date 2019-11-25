"use strict";
import * as url_module from 'url';
/**
 * Any requests with trailing slashes will immediately return a Response object redirecting to a non-trailing-slash path
 */
let killSlash;
killSlash = function (method, url, body, headers, next) {
    let _self = this;
    let parsedUrl = url_module.parse(url);
    let parsedPath = parsedUrl.path;
    if (!parsedPath) {
        return next();
    }
    // kill trailing slash as long as we aren't at the root level
    if (parsedPath !== '/' && parsedPath[parsedPath.length - 1] === '/') {
        return Promise.resolve(new _self.Response('', 302, {
            location: parsedPath.substring(0, parsedPath.length - 1)
        }));
    }
    return next();
};
export default killSlash;
