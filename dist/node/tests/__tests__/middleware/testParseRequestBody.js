"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../../index");
const parseBody = index_1.Middleware.parseBody;
const index_2 = require("../../../index");
const response_1 = require("../../../core/response");
describe('Parse Request Body tests', () => {
    test('test request with valid json body', () => {
        expect.assertions(1);
        const context = {};
        const body = '{"hello": "there"}';
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        parseBody.call(context, '', '', body, { 'content-type': 'application/json' }, () => { });
        expect(context.body).toEqual({ hello: 'there' });
    });
    /**
     * Test that valid json parsing works as expected
     */
    test('test request with invalid json body', () => {
        expect.assertions(1);
        const context = {};
        const body = '{hello ';
        return expect(() => {
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            return parseBody.call(context, '', '', body, { 'content-type': 'application/json' }, () => { });
        }).toThrowError();
    });
    /**
     * Test that valid json parsing works as expected with roads
     */
    test('test used request with valid json body', () => {
        expect.assertions(1);
        const road = new index_2.Road();
        road.use(parseBody);
        const body = '{"hello": "there"}';
        const middleware = function (method, url, request_body, headers) {
            expect(this.body).toEqual({ hello: 'there' });
            return Promise.resolve(new response_1.default(''));
        };
        road.use(middleware);
        road.request('', '', body, {
            'content-type': 'application/json'
        });
    });
    /**
     * Test that invalid json parsing fails as expected with roads
     */
    test('test used request with invalid json body', () => {
        expect.assertions(1);
        const road = new index_2.Road();
        road.use(parseBody);
        const body = '{hello there';
        return expect(road.request('', '', body, {
            'content-type': 'application/json'
        })).rejects.toEqual(new Error('Unexpected token h in JSON at position 1'));
    });
    /**
     * Test that the content type can contain parameters
     */
    test('test content type with parameters', () => {
        expect.assertions(1);
        const context = {};
        const body = '{"hello": "there"}';
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        parseBody.call(context, '', '', body, { 'content-type': 'application/json; charset=utf-8' }, () => { });
        expect(context.body).toEqual({ hello: 'there' });
    });
});
