"use strict";

var roads = require('../../../src/index.js');
let server = require('../../resources/mockServer.js')();

describe('request', () => {
    /**
     * Ensure that the basic request system lines up
     */
    test('Request Without Body', () => {
        expect.assertions(3);
        var client = new roads.Client(false, '127.0.0.1', 8081);
        
        return new Promise((resolve, reject) => {
            
            server.listen(8081, () => {
                resolve(client.request('GET', '/', undefined, {
                    "one" : "two"
                }).then(function (response) {
                    expect(response.status).toEqual(200);
                    expect(response.body).toEqual({ 
                        url: '/',
                        method: 'GET',
                        body: '',
                        headers: { one: 'two', host: '127.0.0.1:8081', connection: 'close' },
                        message: 'hello!' 
                    });
                    expect(response.headers['this-is']).toEqual('for real');

                    server.close();
                }));
            });
        });
    });

    /**
     * Ensure that the basic request system lines up
     */
    test('Request With Body', () => {
        expect.assertions(2);
        var client = new roads.Client(false, '127.0.0.1', 8081);
         
        return new Promise((resolve, reject) => {
            server.listen(8081, () => {
                resolve(client.request('POST', '/', '{"yeah": "what"}', {
                    "three" : "four"
                }).then(function (response) {
                    expect(response.status).toEqual(200);

                    expect(response.body).toEqual({ 
                        url: '/',
                        method: 'POST',
                        // for some reason JSON.stringify is dropping whitespace on this
                        body: '{"yeah": "what"}',
                        headers: { three: 'four', host: '127.0.0.1:8081', connection: 'close', 'transfer-encoding': 'chunked'},
                        message: 'hello!' 
                    });

                    server.close();
                }));
            });
        });
    });
});