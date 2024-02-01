FROM node:18.18 as builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . ./

ARG VITE_APP_HOST=work.3ahtim54r.ru

ARG VITE_APP_PARASWAP_API=https://apps.3ahtim54r.ru/srv-paraswap/api/
ARG VITE_APP_DEBRIDGE_API=https://apps.3ahtim54r.ru/srv-debridge/api/
ARG VITE_APP_SQUID_ROUTER_API=https://apps.3ahtim54r.ru/srv-squidrouter/api/
ARG VITE_APP_SYNAPSE_SWAP_API=https://apps.3ahtim54r.ru/srv-synapse-swap/api/
ARG VITE_APP_SKIP_API=https://apps.3ahtim54r.ru/srv-skip/api/

ARG VITE_APP_DATA_PROVIDER_URL=https://apps.3ahtim54r.ru/srv-data-provider/api

ARG VITE_APP_BRIDGE_DEX_API=https://bridge-dex.3ahtim54r.ru

ARG VITE_APP_PROXY_API=https://proxy-api.apps.citadel.okd.3ahtim54r.ru

ARG VITE_APP_ZOMET_CORE_API_URL=https://zomet-core.3ahtim54r.ru
ARG VITE_APP_TX_MANAGER=https://zomet-tx-manager.3ahtim54r.ru

ARG VITE_APP_RELEASE
ARG VITE_APP_SENTRY_DSN
ARG VITE_APP_MIXPANEL_TOKEN
ARG VITE_APP_WC_PROJECT_ID
ARG VITE_APP_KADO_API_KEY

ARG NODE_ENV

RUN npm run build

FROM nginxinc/nginx-unprivileged:1.18.0-alpine

COPY ./deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /var/www
