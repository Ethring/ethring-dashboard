# Stage #1 - Building the app
FROM node:18.19.0 as builder
WORKDIR /app
COPY package*.json ./
# Turn off husky for docker builds
COPY .husky/ ./.husky
RUN npm ci --production && npm i vite -D
COPY . ./

# Environment variables
ARG HOST=work.3ahtim54r.ru
# Balances data provider API
ARG DATA_PROVIDER_API
# Bridge-dex API
ARG BRIDGE_DEX_API
# Proxy API
ARG PROXY_API
# Backend API
ARG CORE_API
ARG TX_MANAGER_API
# Portal API
ARG PORTAL_FI_API
# Others
ARG RELEASE
# Error tracking
ARG SENTRY_DSN
# Analytics
ARG MIXPANEL_TOKEN
# WalletConnect project ID for Ledger
ARG WC_PROJECT_ID
# APPS API
ARG APPS_API
# Shortcuts API
ARG SHORTCUTS_API

# Kado
ARG KADO_API_KEY
ARG NODE_ENV
ENV NODE_OPTIONS="--max_old_space_size=8192"

# Build
RUN npm run build

# Stage #2 - Serving the app
FROM nginxinc/nginx-unprivileged:1.18.0-alpine

COPY ./deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /var/www
