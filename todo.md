-1. Create a dist folder and have a built roads exported there for other libs to use.
-1. Remove the build script from this library and just have it in the example
-1. use the browser package.json prop if worthwhile
0. Redo setTitle and other middleware to be more generic
1. I don't like how the cookie middleware works. Rethink how we handle this and response creation as a whole
2. Create a typescript example AND CHECK OUT THE BOOTSTRAP YOU FOUND WHILE DOING IT
3. Improve test coverage
4. The current system doesn't properly handle bad http methods. If the route exists, but the method doesn't, we don't 405. If the method is something we know nothing about (e.g. "BanAnANanN"), it should 501
