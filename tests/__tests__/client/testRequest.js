/*"use strict";

var roads = require('../../../index.js');

/**
 * Ensure that the basic request system lines up
 */
/*test('testRequestWithoutBody', () => {
    let server = require('./mockServer.js')();
    var client = new roads.Client(false, '127.0.0.1', 8081);
        
    server.listen(8081, () => {
        client.request('GET', '/', undefined, {
            "one" : "two"
        }).then(function (response) {
            test.deepEqual(response.status, 200);
            test.deepEqual(response.body, { 
                url: '/',
                method: 'GET',
                body: '',
                headers: { one: 'two', host: '127.0.0.1:8081', connection: 'close' },
                message: 'hello!' 
            });
            test.deepEqual(response.headers['this-is'], 'for real');

            server.close();
            test.done();
        })
        .catch((err) => {
            console.log(err);
            test.fail(err);
            server.close();
            test.done();
        });
    });
};

/**
 * Ensure that the basic request system lines up
 */
/*test('testRequestWithBody', () => {
    let server = require('./mockServer.js')();
    var client = new roads.Client(false, '127.0.0.1', 8081);
        
    server.listen(8081, () => {
        client.request('POST', '/', '{"yeah": "what"}', {
            "three" : "four"
        }).then(function (response) {
            test.deepEqual(response.status, 200);

            test.deepEqual(response.body, { 
                url: '/',
                method: 'POST',
                // for some reason JSON.stringify is dropping whitespace on this
                body: '{"yeah": "what"}',
                headers: { three: 'four', host: '127.0.0.1:8081', connection: 'close', 'transfer-encoding': 'chunked'},
                message: 'hello!' 
            });

            server.close();
            test.done();
        })
        .catch((err) => {
            console.log(err);
            test.fail(err);
            server.close();
            test.done();
        });
    });
};
//*/