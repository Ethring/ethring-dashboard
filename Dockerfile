FROM node:14 as builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . ./

ARG VUE_APP_HOST=work.3ahtim54r.ru

ARG VUE_APP_PARASWAP_API=https://apps.3ahtim54r.ru/srv-paraswap/api/
ARG VUE_APP_1INCH_SWAP_API=https://apps.3ahtim54r.ru/srv-1inch-swap/api/
ARG VUE_APP_DEBRIDGE_API=https://apps.3ahtim54r.ru/srv-debridge/api/
ARG VUE_APP_SQUID_ROUTER_API=https://apps.3ahtim54r.ru/srv-squidrouter/api/
ARG VUE_APP_SYNAPSE_SWAP_API=https://apps.3ahtim54r.ru/srv-synapse-swap/api/

ARG VUE_APP_DATA_PROVIDER_URL=https://apps.3ahtim54r.ru/srv-data-provider/api

ARG VUE_APP_PROXY_API=https://proxy-api.apps.citadel.okd.3ahtim54r.ru

ARG VUE_APP_ZOMET_CORE_API_URL=https://zomet-core.3ahtim54r.ru

ARG VUE_APP_RELEASE
ARG VUE_APP_SENTRY_DSN
ARG VUE_APP_MIXPANEL_TOKEN

ARG NODE_ENV

RUN npm run build

FROM nginxinc/nginx-unprivileged:1.18.0-alpine

COPY ./deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /var/www
