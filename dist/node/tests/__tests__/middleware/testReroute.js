'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../../index");
const reroute = index_1.Middleware.reroute;
const response_1 = require("../../../core/response");
describe('Reroute middleware tests', () => {
    /**
     * Tests that the provided road's request method is bound to the
     * original road's context under the provided key
     */
    test('test request method is bound to context key', () => {
        expect.assertions(3);
        const request = function (method, path, body, headers) {
            return Promise.resolve(new response_1.default('banana'));
        };
        const mockRoad = {
            request: request
        };
        const key = 'foo';
        const context = {};
        const middleware = reroute(key, mockRoad);
        expect(typeof (middleware)).toEqual('function');
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        middleware.call(context, 'a', 'b', 'c', {}, function () { });
        expect(typeof (context[key])).toEqual('function');
        return expect(context[key]()).resolves.toEqual(new response_1.default('banana'));
    });
});
