"use strict";

const port = 8081;

let routes = {
    '/': {
        'GET': (body, headers) => {
            return {
                status: 200,
                headers: {
                    "this-is": "for real",
                    "content-type": "application/json"
                },
                body: JSON.stringify({
                    url: '/',
                    method: 'GET',
                    body: body,
                    headers: headers,
                    message: "hello!"
                })
            };
        },
        'POST': (body, headers) => {
            return {
                status: 200,
                headers: {
                    "content-type": "application/json"
                },
                body: JSON.stringify({
                    url: '/',
                    method: 'POST',
                    body: body,
                    headers: headers,
                    message: "hello!"
                })
            }
        }
    }
}


function router (method, url, body, headers) {
    if (routes[url] && routes[url][method]) {
        return routes[url][method](body, headers);
    }

    return {
        message: "invalid url"
    }
}

module.exports = () => {
    let server = require('http').createServer();

    let body = '';
    let bodyFound = false;

    server.on('request', (request, response) => {
        // Get all the streaming input data from the request
        request.on('readable', () => {
            bodyFound = true;
            let chunk = null;

            while (null !== (chunk = request.read())) {
                body += chunk;
            }
        });

        // When the request stops sending data, wrap it all up and find the proper API response
        request.on('end', () => {
            if (!bodyFound) {
                body = undefined;
            }

            let routerResponse = router(request.method, request.url, body, request.headers);
            response.writeHead(routerResponse.status, routerResponse.headers ? routerResponse.headers : {});

            if (typeof routerResponse.body !== "undefined") {
                response.write(routerResponse.body);
            }

            response.end();
        });

        // Handle any errors
        request.on('error', (err) => {
            throw err;
        });
    });

    server.on('error', (err) => {
        throw err;
    });
    
    return server;
};