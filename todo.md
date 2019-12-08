1. Typescript
- Do a pass on all classes, mark things as protected
- Do a pass on everything that might return null, undefined or void. Should it be optional?
- Fix the example, find the best way to make it work with typescript. Cross fingers that the current system works at all.
2. Ensure documentation is up to date (all middleware, all methods on all objects, pjax included)
3. The current system doesn't properly handle bad http methods. If the route exists, but the method doesn't, we don't 405. If the method is something we know nothing about (e.g. "BanAnANanN"), it should 501