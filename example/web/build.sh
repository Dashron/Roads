#prod
browserify client.js -d -p [minifyify --map /client.map.json --output client.map.json] > client.brws.js
#debug
#browserify client.js -d > client.brws.js
