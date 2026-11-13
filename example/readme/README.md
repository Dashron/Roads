# Roads readme example

This is the finished code from the [Getting Started guide](../../README.md#getting-started) in the Roads readme, written in TypeScript. One road, in `src/road.ts`, handles requests in three places: a plain Node.js script, an Express server, and the browser.

The code in `src/` matches the guide's `road.ts`, `server.ts`, `client.ts` and `serverRoutes.ts`, with one difference. The guide runs its files directly with Node, so its imports end in `.ts`. This example compiles with `tsc` first and runs the compiled JavaScript, so its imports end in `.js`.

## Install the example

This example uses the copy of Roads in this repository, so build Roads first. From the root of the repository, run these commands.

```bash
npm install
npm run build
```

Then install the example's dependencies.

```bash
cd example/readme
npm install
```

## Call the road from a script

`src/direct.ts` calls the road with no server running. This command compiles the example, then runs that script.

```bash
npm run direct
```

After the build output, you should see these two lines. The first line comes from the logging middleware in `src/road.ts`. The script isn't running in the browser, so the road wraps the response in the full page.

```
GET /users/dashron
200 <!doctype html><body><div id="container">Hello, dashron!</div><script src="/client.js"></script></body>
```

## Run the road on a server

`src/server.ts` uses `expressConnector` to pass each request that Express receives to the road. It also uses `express.static` to send the browser bundle from the `public` folder, and adds the server-only routes from `src/serverRoutes.ts`. `npm start` compiles the example, builds the browser bundle, then starts the server.

```bash
npm start
```

Visit `http://localhost:3000/hello`. The page shows **Hello, Roads!** and a link, and your terminal prints `GET /hello`. Your terminal may also print `GET /favicon.ico`, because browsers request that file on their own.

Visit `http://localhost:3000/secret`. The page shows `Only the server has this route.` Only `src/server.ts` imports `src/serverRoutes.ts`, so this route isn't in the browser bundle.

## Run the road in the browser

`src/client.ts` runs the same road in the browser when someone clicks a link that has the `data-roads-pjax="link"` attribute.

Click **Say hello to dashron**. The page shows `Hello, dashron!` and the address bar changes to `/users/dashron`, but the page doesn't reload. The browser's console prints `GET /users/dashron`, and your terminal doesn't, because the road ran in the browser.

If your terminal prints `GET /users/dashron`, the browser loaded a whole new page instead. Check that `http://localhost:3000/client.js` shows JavaScript code.
