
-3. Profiling (and write about it) Typescript: https://github.com/microsoft/TypeScript/wiki/Performance#performance-tracing Node: https://nodejs.org/en/docs/guides/simple-profiling/
-2. Add a "this request only" request chain to the simple router, allowing you to bind a series of functions to a single url. Have it work like the request chain in road.
-1. Have the package-lock automatically updated pre-commit
1. Ensure we have JS and Typescript examples for everything.
2. Improve the client-build docs
3. Improve test coverage (cors, simple router, pjax, probably much more)
4. The current system doesn't properly handle bad http methods. If the route exists, but the method doesn't, we don't 405. If the method is something we know nothing about (e.g. "BanAnANanN"), it should 501
5. Scan for todos and mark them in this file!