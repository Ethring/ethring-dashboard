FROM node:14 as builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . ./

ARG VUE_APP_BACKEND_URL=//work.3ahtim54r.ru/api
ARG VUE_APP_HOST=work.3ahtim54r.ru
ARG VUE_APP_1INCH_SWAP_API=https://apps.3ahtim54r.ru/srv-1inch-swap/api/
VUE_APP_DEBRIDGE_API=https://apps.3ahtim54r.ru/srv-debridge/api/
ARG VUE_APP_ZOMET_CORE_API_URL
ARG VUE_APP_RELEASE
ARG VUE_APP_SENTRY_DSN
ARG VUE_APP_ZOMET_CORE_API_URL=https://zomet-core.3ahtim54r.ru
ARG NODE_ENV

RUN npm run build

FROM nginxinc/nginx-unprivileged:1.18.0-alpine

COPY ./deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /var/www
