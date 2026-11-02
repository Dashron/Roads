// road.ts
// The road that direct.ts, server.ts and client.ts all share
import { Road } from 'roads';

const road = new Road();

road.use(async function (method, path, body, headers, next) {
    console.log(`${method} ${path}`);
    return next();
});

road.use(async function (method, path, body, headers) {
    return `<h1>Hello from ${path}!</h1><a href="/users" data-roads-pjax="link">Go to /users</a>`;
});

export default road;
