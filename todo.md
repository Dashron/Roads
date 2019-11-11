1. Typescript
- Get simplerouter working without converting to the URL class
2. Ensure documentation is up to date (all middleware, all methods on all objects, pjax included)
3. The current system doesn't properly handle bad http methods. If the route exists, but the method doesn't, we don't 405. If the method is something we know nothing about (e.g. "BanAnANanN"), it should 501