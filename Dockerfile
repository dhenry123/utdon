# @author DHENRY for mytinydc.com
# @license AGPL3

ARG RUNASUSER="utdon"
ARG RUNASUSERID="1001"
ARG RUNASGROUP="1001"

FROM node:20.18-alpine3.20 AS base

# build
FROM base AS builder

WORKDIR /app

# Server
COPY ./src/ ./src/
COPY ./openapi.yaml .
COPY ./package.json .
COPY ./locales ./locales
COPY ./tsconfig.json .
# Building server, final dest is /dist
RUN npm install && npm run build
RUN rm -rf node_modules && npm install --omit=dev
# Client
COPY ./client ./client
RUN rm -rf client/node_modules client/tools client/dist client/.storybook
# Remove stories
RUN find ./client -name "*.stories.*" -exec rm -rf {} \;

# Building client, final dest is client/dist
RUN cd client && npm install --omit=dev && npm run build

FROM base AS runner
LABEL org.opencontainers.image.source=https://github.com/dhenry123/utdon
LABEL org.opencontainers.image.description="Multi arch image"
LABEL org.opencontainers.image.licenses=AGPLV3

ARG RUNASUSER
ARG RUNASUSERID
ARG RUNASGROUP

# Creating user & group
RUN addgroup -S ${RUNASUSER} --gid "${RUNASGROUP}" && adduser -S ${RUNASUSER} -s /bin/sh --uid "${RUNASUSERID}" -G ${RUNASUSER}

USER ${RUNASUSERID}

WORKDIR /app

COPY --from=builder --chown=${RUNASUSERID}:${RUNASGROUP} /app/dist/ ./
COPY --from=builder --chown=${RUNASUSERID}:${RUNASGROUP} /app/openapi.yaml ./
COPY --from=builder --chown=${RUNASUSERID}:${RUNASGROUP} /app/node_modules/ ./node_modules
COPY --from=builder --chown=${RUNASUSERID}:${RUNASGROUP} /app/client/dist/ ./public

# data directory for mount point
RUN mkdir data

EXPOSE 3015

CMD ["node","main.js"]
