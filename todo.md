-1. Have browserify build into the dist folder and put that command into a pre-npm hook (build? make sure tsc is here too)
-1. Get the JS example working using the new distribution method, and ensure its loading the browser dist (browser prop in package.json?)
-1. Remove as many "as {type}" hacks as you can
1. Create a typescript example AND CHECK OUT THE BOOTSTRAP YOU FOUND WHILE DOING IT
2. Improve test coverage (cors, simple router, probably much more)
3. The current system doesn't properly handle bad http methods. If the route exists, but the method doesn't, we don't 405. If the method is something we know nothing about (e.g. "BanAnANanN"), it should 501
4. Scan for todos and mark them in this file!
