// server.ts
// On a Node.js server, pass each incoming request to the road
import express from 'express';
import { expressConnector } from 'roads';
import road from './road.js';
import addServerRoutes from './serverRoutes.js';

addServerRoutes(road);

const app = express();

// Serve the bundle that "npm run build" creates from client.ts
app.use(express.static('public'));

app.use(expressConnector(road));

app.listen(3000);
console.log('Server running at http://localhost:3000/hello');
