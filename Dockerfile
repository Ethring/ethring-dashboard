FROM node:14 as builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . ./

ARG VUE_APP_BACKEND_URL=//work.3ahtim54r.ru/api

RUN npm run build

FROM nginxinc/nginx-unprivileged:1.18.0-alpine

COPY ./deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /var/www
