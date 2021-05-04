"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../../index");
const cookie = index_1.Middleware.cookie;
const response_1 = require("../../../core/response");
describe('cookie tests', () => {
    test('test cookie middleware parses cookies into context', () => {
        expect.assertions(2);
        const context = {
            Response: response_1.default
        };
        cookie.call(context, 'a', 'b', 'c', {
            cookie: 'foo=bar;abc=def'
        }, function () { return Promise.resolve('test'); });
        expect(context.getCookies().foo).toEqual('bar');
        expect(context.getCookies().abc).toEqual('def');
    });
    test('test cookie middleware will update the response headers', () => {
        expect.assertions(1);
        const context = {
            Response: response_1.default
        };
        const next = function () {
            this.setCookie('foo', 'bar');
            return Promise.resolve('test');
        };
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        expect(cookie.call(context, 'a', 'b', 'c', {}, next.bind(context))).resolves.toEqual(new response_1.default('test', 200, {
            'Set-Cookie': ['foo=bar']
        }));
    });
    /*test('test that getCookies merges new and old cookies together', () => {

    });*/
});
