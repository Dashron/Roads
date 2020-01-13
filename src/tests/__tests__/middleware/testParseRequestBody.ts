"use strict";

import * as Middleware from '../../../middleware';
let parseBody = Middleware.parseBody;

import { Middleware as MiddlewareType } from '../../../road';
import { Road } from '../../../index';
import Response from '../../../response';

describe('Parse Request Body tests', () => {
	test('test request with valid json body', () => {
        expect.assertions(1);
        let context: {[X: string]: any} = {};
        var body = '{"hello": "there"}';

        parseBody.call(context, '', '', body, {'content-type': 'application/json'}, () => {});
        expect(context.body).toEqual({hello: "there"});
    });

    /**
     * Test that valid json parsing works as expected
     */
    test('test request with invalid json body', () => {
        expect.assertions(1);
        let context = {};
        var body = '{hello ';

        return expect(() => {
            return parseBody.call(context, '', '', body, {'content-type': 'application/json'}, () => {});
        }).toThrowError();
    });

    /**
     * Test that valid json parsing works as expected with roads
     */
    test('test used request with valid json body', () => {
        expect.assertions(1);

        var road = new Road();
        road.use(parseBody);
        var body = '{"hello": "there"}';

        let middleware: MiddlewareType;
        middleware = function (method, url, request_body, headers) {
            expect(this.body).toEqual({hello: "there"});
            return Promise.resolve(new Response(''));
        };

        road.use(middleware);

        road.request('', '', body, {
            'content-type' : "application/json"
        });
    });

    /**
     * Test that invalid json parsing fails as expected with roads
     */
    test('test used request with invalid json body', () => {
        expect.assertions(1);
        var road = new Road();
        road.use(parseBody);
        var body = '{hello there';

        return expect(road.request('', '', body, {
            'content-type' : "application/json"
        })).rejects.toEqual(new Error('Unexpected token h in JSON at position 1'));
    });


    /**
     * Test that the content type can contain parameters
     */
    test('test content type with parameters', () => {
        expect.assertions(1);
        let context: {[X: string]: any};
        context = {};
        var body = '{"hello": "there"}';

        parseBody.call(context, '', '', body, {'content-type': 'application/json; charset=utf-8'}, () => {})
        expect(context.body).toEqual({hello: "there"});
    });
});