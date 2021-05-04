"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../../index");
const killSlash = index_1.Middleware.killSlash;
const response_1 = require("../../../core/response");
describe('KillSlashes tests', () => {
    test('test kill slash doesn\'t break normal', () => {
        expect.assertions(1);
        const method = 'GET';
        const url = '/users';
        const body = {};
        const headers = {};
        const contents = 'fooo';
        const next = function () {
            return new Promise(function (accept, reject) {
                accept(contents);
            });
        };
        return expect(killSlash.call({}, method, url, body, headers, next)).resolves.toEqual(contents);
    });
    /**
 * Test that a request with slash fixing, on a request with a trailing slash is turned into a redirect response
 */
    test('test kill slash only trailing slash fixing a route', () => {
        expect.assertions(1);
        const method = 'GET';
        const url = '/users/';
        const body = {};
        const headers = {};
        const contents = 'fooo';
        const next = function () {
            return new Promise(function (accept, reject) {
                accept(contents);
            });
        };
        return expect(killSlash.call({
            // the redirection needs the Response context
            Response: response_1.default
        }, method, url, body, headers, next)).resolves.toEqual({
            status: 302,
            body: '',
            headers: {
                location: '/users'
            }
        });
    });
    /**
     * Test that a request with slash fixing on a request to the root endpoint isn't messed up.
     * Technically it's a trailing slash, so I added this test to test the edge case
     */
    test('test kill slash not breaking on root', () => {
        expect.assertions(1);
        const method = 'GET';
        const url = '/';
        const body = {};
        const headers = {};
        const contents = 'fooo';
        const next = function () {
            return new Promise(function (accept, reject) {
                accept(contents);
            });
        };
        return expect(killSlash.call({}, method, url, body, headers, next)).resolves.toEqual(contents);
    });
});
