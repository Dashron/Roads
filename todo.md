-1. Get new ts example working (needs client cookie fixed, client js tested, full example tested)
-1. Remove as many "as {type}" hacks as you can
-1. Ensure the docs are correct
1. Look into the bootstrap article you found for module etc.
2. Improve test coverage (cors, simple router, probably much more)
3. The current system doesn't properly handle bad http methods. If the route exists, but the method doesn't, we don't 405. If the method is something we know nothing about (e.g. "BanAnANanN"), it should 501
4. Scan for todos and mark them in this file!
