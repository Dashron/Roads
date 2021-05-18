"use strict";
/**
 * emptyTo404.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This file is an example of how to apply HTML layouts via a middleware system
 */
exports.__esModule = true;
/**
 * This middleware translates missing responses into 404s
 *
 * @param {string} method - HTTP request method
 * @param {string} url - HTTP request url
 * @param {string} body - HTTP request body
 * @param {object} headers - HTTP request headers
 * @param {function} next - When called, this function will execute the next step in the roads method chain
 */
var emptyTo404 = function (method, url, body, headers, next) {
    var _this = this;
    return next()
        .then(function (response) {
        if (!response) {
            return new _this.Response('Page not found', 404);
        }
        return response;
    });
};
exports["default"] = emptyTo404;
