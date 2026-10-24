/**
 * server.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This file starts up the HTTP roads server
 */

import express from 'express';
import buildApiRoad from './api/buildApiRoad.js';
import buildServerRoad from './buildServerRoad.js';
import { expressConnector } from './middleware/expressConnector.js';

// Browsers resolve localhost to this address too, so http://localhost and http://127.0.0.1 both reach the server
const host = '127.0.0.1';
// Set the PORT environment variable to use a different port
const port = Number(process.env.PORT ?? 8081);

// Pages from both of these origins may call the API from the browser. They're different origins, so opening
//		the example at one and calling the API at the other shows CORS in action (see /client-requests)
const apiRoad = buildApiRoad([`http://localhost:${port}`, `http://127.0.0.1:${port}`]);
const road = buildServerRoad(apiRoad);

const app = express();

app.set('etag', false);
// Roads expects the raw body as a string, and ParseBodyMiddleware handles JSON and forms
app.use(express.text({ type: '*/*' }));
// Express removes the /api prefix from req.url, so /api/posts reaches the API road as /posts
app.use('/api', expressConnector(apiRoad));
app.use(expressConnector(road));

app.listen(port, host, function (err?: Error) {
	// Express 5 passes startup errors (such as the port already being in use) to this callback instead of throwing them
	if (err) {
		console.error(`server failed to start at http://${host}:${port}`, err);
		process.exitCode = 1;
		return;
	}

	console.log(`server has started at http://localhost:${port} and http://${host}:${port}`);
});
