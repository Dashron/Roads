// server.ts
// On a Node.js server, pass each incoming request to the road
import express from 'express';
import { Road, expressConnector } from 'roads';
import type { Context } from 'roads';
import road from './road.js';

const app = express();

// Serve the bundle that "npm run build" creates from client.ts
app.use(express.static('public'));

// Roads expects the request body as a string
app.use(express.text({ type: '*/*' }));

// Only the server sends a whole page, because the browser already has one. So this wraps the shared road
//		instead of being part of it
const pageRoad = new Road();

pageRoad.use<Context, string | undefined>(async function (method, path, body, headers) {
    const response = await road.request(method, path, body, headers);
    response.body = `<!doctype html><body>${response.body}<script src="/client.js"></script></body>`;
    return response;
});

app.use(expressConnector(pageRoad));

app.listen(3000);
console.log('Server running at http://localhost:3000/hello');
