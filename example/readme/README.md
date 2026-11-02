# Roads readme example

This is the full version of the example at the top of the [Roads readme](../../README.md), written in TypeScript. One road, in `src/road.ts`, handles requests in three places: a plain Node.js script, an Express server, and the browser.

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

You should see this output after the build output. The first line comes from the logging middleware in `src/road.ts`.

```
GET /users
200 <h1>Hello from /users!</h1><a href="/users" data-roads-pjax="link">Go to /users</a>
```

## Run the road on a server

`src/server.ts` uses `expressConnector` to pass each request that Express receives to the road, and wraps each response in a page that loads the browser bundle. `npm start` compiles the example, builds the browser bundle, then starts the server.

```bash
npm start
```

Visit `http://localhost:3000/hello`. The page shows `Hello from /hello!`, and your terminal prints `GET /hello`. Your terminal may also print `GET /favicon.ico`, because browsers request that file on their own.

## Run the road in the browser

`src/client.ts` runs the same road in the browser when someone clicks a link that has the `data-roads-pjax="link"` attribute.

Click **Go to /users** on the page. The page shows `Hello from /users!`, the url changes to `/users`, and the browser's console logs `GET /users`. Your terminal doesn't print `GET /users`, because the road ran in the browser.

If your terminal prints `GET /users`, the browser loaded a whole new page. Check that `http://localhost:3000/client.js` loads.
