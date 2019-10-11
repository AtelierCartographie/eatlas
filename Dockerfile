FROM node:carbon-alpine

ARG SOURCE_COMMIT

ENV SOURCE_COMMIT=${SOURCE_COMMIT}

RUN mkdir -p /eatlas/.git && echo $SOURCE_COMMIT > /eatlas/.git/ORIG_HEAD

ENV NODE_ENV production

ENV NODE_CONFIG_DIR /eatlas/config/

COPY package.json /eatlas/
COPY server/package.json /eatlas/server/
COPY client/ /eatlas/client/

RUN apk add --no-cache su-exec git


RUN cd /eatlas && yarn install --no-cache --production --ignore-scripts \
    && cd /eatlas/server && yarn install --no-cache --production && yarn git-version \
    && cd /eatlas/client && yarn install --no-cache --production=false 

COPY config/ /eatlas/config/
COPY server/ /eatlas/server/

RUN mkdir -p /eatlas/data/uploads && chown -R node:node /eatlas/data/uploads

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

WORKDIR /eatlas/server/

EXPOSE 4000

VOLUME /eatlas/client/

ENTRYPOINT ["/docker-entrypoint.sh"] 

