"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../../index");
describe('road use', () => {
    /**
     * Test that the use function returns itself for viable chaining
     */
    test('Use Returns Self', () => {
        expect.assertions(1);
        const road = new index_1.Road();
        expect(road.use(function (method, path, body, headers, next) {
            return next();
        })).toEqual(road);
    });
});
