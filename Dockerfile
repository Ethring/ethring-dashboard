FROM node:18.19.0 as builder

# Create app directory
WORKDIR /app

# Copy package.json and package-lock.json before other files
COPY package*.json ./

# Install dependencies with npm ci
RUN npm ci

# Copy all files
COPY . ./


# Environment variables

ARG VITE_APP_HOST=work.3ahtim54r.ru

# API
ARG VITE_APP_PARASWAP_API=https://apps.3ahtim54r.ru/srv-paraswap/api/
ARG VITE_APP_DEBRIDGE_API=https://apps.3ahtim54r.ru/srv-debridge/api/
ARG VITE_APP_SQUID_ROUTER_API=https://apps.3ahtim54r.ru/srv-squidrouter/api/
ARG VITE_APP_SYNAPSE_SWAP_API=https://apps.3ahtim54r.ru/srv-synapse-swap/api/
ARG VITE_APP_SKIP_API=https://apps.3ahtim54r.ru/srv-skip/api/

# Balances data provider API
ARG VITE_APP_DATA_PROVIDER_URL=https://apps.3ahtim54r.ru/srv-data-provider/api

# Bridge-dex API
ARG VITE_APP_BRIDGE_DEX_API=https://bridge-dex.3ahtim54r.ru

# Proxy API
ARG VITE_APP_PROXY_API=https://proxy-api.apps.citadel.okd.3ahtim54r.ru

# Backend API
ARG VITE_APP_ZOMET_CORE_API_URL=https://zomet-core.3ahtim54r.ru
ARG VITE_APP_TX_MANAGER=https://zomet-tx-manager.3ahtim54r.ru

# Others
ARG VITE_APP_RELEASE

# Error tracking
ARG VITE_APP_SENTRY_DSN

# Analytics
ARG VITE_APP_MIXPANEL_TOKEN

# WalletConnect
ARG VITE_APP_WC_PROJECT_ID

# Kado
ARG VITE_APP_KADO_API_KEY

ARG NODE_ENV

# Build
RUN npm run build

# Nginx
FROM nginxinc/nginx-unprivileged:1.18.0-alpine

COPY ./deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /var/www
