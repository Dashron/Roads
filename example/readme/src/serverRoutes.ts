// serverRoutes.ts
// Routes that only the server has. Only server.ts imports this file, so it never ends up in the browser bundle
import { Road, RouterMiddleware } from 'roads';

export default function addServerRoutes(road: Road) {
    const router = new RouterMiddleware.Router(road);

    router.addRoute('GET', '/secret', async function (method, url, body, headers, next) {
        return 'Only the server has this route.';
    });
}
