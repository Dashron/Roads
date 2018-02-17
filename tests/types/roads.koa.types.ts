import * as Koa from "koa";
import { Middleware } from "koa-compose";
import { Context } from "vm";
import {integrations, middleware, Response, Road} from "../..";

const road = new Road();
const app = new Koa();
const router = new middleware.SimpleRouter(road);

road.use(middleware.cors("*"));

road.use(middleware.killSlash);

app.use(integrations.koa(road) as Middleware<Context>);

router.addRoute("GET", "/user", () => {
    return new Response({name: "test"}, 200, {"last-modified": (new Date()).toString()});
});

road.request("GET", "/user")
    .then((response) => {
        console.log(`response: ${JSON.stringify(response)}`);
    });

app.listen(3000, () => {
    console.log("Server running on port 3000");
});
