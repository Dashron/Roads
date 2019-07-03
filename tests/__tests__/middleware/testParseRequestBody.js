"use strict";


const roads = require('../../../index.js');

describe('Parse Request Body tests', () => {
	test('test request with valid json body', () => {
        expect.assertions(1);
        let context = {};
        var body = '{"hello": "there"}';

        roads.middleware.parseBody.call(context, '', '', body, {'content-type': 'application/json'}, () => {});
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
            return roads.middleware.parseBody.call(context, '', '', body, {'content-type': 'application/json'}, () => {});
        }).toThrowError();
    });

    /**
     * Test that valid json parsing works as expected with roads
     */
    test('test used request with valid json body', () => {
        expect.assertions(1);

        var road = new roads.Road();
        road.use(roads.middleware.parseBody);
        var body = '{"hello": "there"}';

        road.use(function (method, url, request_body, headers) {
            expect(this.body).toEqual({hello: "there"});
        });

        road.request('', '', body, {
            'content-type' : "application/json"
        });
    });

    /**
     * Test that invalid json parsing fails as expected with roads
     */
    test('test used request with invalid json body', () => {
        expect.assertions(1);
        var road = new roads.Road();
        road.use(roads.middleware.parseBody);
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
        let context = {};
        var body = '{"hello": "there"}';

        roads.middleware.parseBody.call(context, '', '', body, {'content-type': 'application/json; charset=utf-8'}, () => {})
        expect(context.body).toEqual({hello: "there"});
    });
});