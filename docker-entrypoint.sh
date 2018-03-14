#!/bin/sh

export PUBLIC_URL=$REACT_APP_ADMIN_URL

cd /eatlas/client && yarn build

cd /eatlas/server && su-exec node:node /usr/local/bin/node ./server.js
