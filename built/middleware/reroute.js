"use strict";
/**
 * Applies a method to the request context that allows you to make requests into another roads object
 *
 * @param {string} key - The name of the key in the request context that will store the roads request.
 * @param  {road} road - The roads object that you will interact with.
 * @return {function} The middleware function. This value should be passed to road.use(fn);
 */
export default function (key, road) {
    let reroute;
    reroute = function (route_method, route_path, route_body, route_headers, next) {
        this[key] = function (method, path, body, headers) {
            if (!headers) {
                headers = {};
            }
            return road.request(method, path, body, headers);
        };
        return next();
    };
    return reroute;
}
;
