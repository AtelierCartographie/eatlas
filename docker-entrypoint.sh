#!/bin/sh

cd /eatlas/client && yarn build

cd /eatlas/server && su-exec node:node /usr/local/bin/node ./server.js
