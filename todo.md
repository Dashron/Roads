-1. Get new ts example working (ensure pages load, link pjax works, form pjax works, cookies are set server side, cookies are set client side, page titles work, 404 works))
-1. Remove as many "as {type}" hacks as you can
-1. Ensure the docs are correct
1. See if we should pull anything over from this bootstrap (https://www.matuzo.at/blog/html-boilerplate/) or this boilerplate (https://html5boilerplate.com/)
2. Improve test coverage (cors, simple router, probably much more)
3. The current system doesn't properly handle bad http methods. If the route exists, but the method doesn't, we don't 405. If the method is something we know nothing about (e.g. "BanAnANanN"), it should 501
4. Scan for todos and mark them in this file!
