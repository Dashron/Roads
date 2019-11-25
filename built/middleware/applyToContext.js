"use strict";
/**
 * Very simple middleware to apply a single value to the request context.
 *
 * @param {string} key - The key that should store the value on the request context.
 * @param {*} val - The value to apply to the request context.
 * @returns {function} The middleware function to apply to the road.use(fn) method.
 */
module.exports = function (key, val) {
    let applyToContext;
    applyToContext = function (method, url, body, headers, next) {
        this[key] = val;
        return next();
    };
    return applyToContext;
};
