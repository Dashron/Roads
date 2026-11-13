// road.ts
// The road that direct.ts, server.ts and client.ts all share
import { Road, RouterMiddleware, LayoutMiddleware, attachCommonMiddleware } from 'roads';

const road = new Road();

road.use(async function (method, path, body, headers, next) {
    console.log(`${method} ${path}`);
    return next();
});

attachCommonMiddleware(road);

// Wrap each response in a full page, but only on the server, because the browser already has the page
if (typeof window === 'undefined') {
    road.use(LayoutMiddleware.build(function (body) {
        return `<!doctype html><body><div id="container">${body}</div><script src="/client.js"></script></body>`;
    }));
}

const router = new RouterMiddleware.Router(road);

router.addRoute('GET', '/hello', async function (method, url, body, headers, next) {
    return '<h1>Hello, Roads!</h1><a href="/users/dashron" data-roads-pjax="link">Say hello to dashron</a>';
});

router.addRoute('GET', '/users/$name', async function (method, url, body, headers, next) {
    return `Hello, ${url.args?.name}!`;
});

export default road;
