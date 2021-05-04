"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../../index");
const index_2 = require("../../../index");
// Note: This file used to have many more tests, but a recent roads change invalidated most of them, and the
//	migration to jest made it clear that many of them were
// covered by other tests (context, multi use, etc)
describe('road buildNext test', () => {
    /**
     * Test buildNext success when a route does not have an onRequest handler
     */
    test('build next hits', () => {
        expect.assertions(1);
        const road = new index_1.Road();
        return expect(road['_buildNext']('GET', '/', '', {}, {
            request: function () { return Promise.resolve(new index_2.Response('')); },
            Response: index_2.Response
        })()).resolves.toEqual(new index_2.Response('Page not found', 404, {}));
    });
});
