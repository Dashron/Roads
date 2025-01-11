1. Figure out a way to have better typing on headers
2. Add a "this request only" request chain to the simple router, allowing you to bind a series of functions to a single url. Have it work like the request chain in road.
3. Have the package-lock automatically updated pre-commit
4. Ensure we have JS and Typescript examples for everything.
5. Improve test coverage (cors, simple router, pjax, probably much more)
6. The current system doesn't properly handle bad http methods. If the route exists, but the method doesn't, we don't 405. If the method is something we know nothing about (e.g. "BanAnANanN"), it should 501
7. Scan for todos and mark them in this file!