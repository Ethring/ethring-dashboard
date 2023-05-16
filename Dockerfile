FROM node:14 as builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . ./

ARG VUE_APP_BACKEND_URL=//work.3ahtim54r.ru/api
ARG VUE_APP_HOST=work.3ahtim54r.ru
ARG VUE_APP_1INCH_SWAP_API=https://apps.3ahtim54r.ru/srv-1inch-swap/api/
ARG VUE_APP_RELEASE
ARG VUE_APP_SENTRY_DSN
ARG NODE_ENV

RUN npm run build

FROM nginxinc/nginx-unprivileged:1.18.0-alpine

COPY ./deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /var/www
