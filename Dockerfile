# ------------ NodeJS ------------

# Stage #1 - Building the app
FROM node:18.19.0 as builder

# Create app directory
WORKDIR /app

# Copy package.json and package-lock.json before other files
COPY package*.json ./

# Turn off husky for docker builds
COPY .husky/ ./.husky

# Install dependencies with npm ci
RUN npm ci --production && npm i vite -D

# Copy all files
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

# Others
ARG RELEASE

# Error tracking
ARG SENTRY_DSN

# Analytics
ARG MIXPANEL_TOKEN

# WalletConnect project ID for Ledger
ARG WC_PROJECT_ID

# Kado
ARG KADO_API_KEY

ARG NODE_ENV

# Build
RUN npm run build

# ------------ NGINX ------------

# Stage #2 - Serving the app
FROM nginxinc/nginx-unprivileged:1.18.0-alpine

COPY ./deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /var/www
