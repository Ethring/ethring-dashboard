# Ethring

## Setup

```bash
# Install all dependencies
npm i
```

```bash
# Local page with hot reload at http://localhost:5173
npm run dev
```

```bash
# Build for production with minification
npm run build
```

```bash
# Debug build production, use this command to analyze bundle
npm run build:debug
```

```bash
# Build for production and view the bundle analyzer report
npm run build --report
```

```bash
# Playwright e2e test report
npm run test:report
```

## Environments

| Environment Variable | Description                                                                                          |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| `NODE_ENV`           | Environment mode, can be one of the following values: `development`, `production`, `test`;           |
| `LOG_LEVEL`          | The level of logging, can be one of the following values: `error`, `warn`, `info`, `debug`, `trace`  |
| `CORE_API`           | The main API for obtaining configurations for chains and tokens                                      |
| `TX_MANAGER_API`     | The main API for obtaining transactions for the account, and also for getting the transaction status |
| `DATA_PROVIDER_API`  | The main API for obtaining balance for the account                                                   |
| `BRIDGE_DEX_API`     | The main API for obtaining super-swap transactions                                                   |
| `PROXY_API`          | The main API for obtaining the prices of tokens via the proxy                                        |
| `IS_ANALYZE`         | The main flag for analyzing the bundle for production build                                          |
| `PORTAL_FI_API`      | The main API for make POOL operations                                                                |
| `APPS_API`           | The main API for interacting with the application |
| `SHORTCUTS_API`      | The main API for shortcuts operations                                                                |

### Important `DATA_PROVIDER_API`

To get the balance for the account, please specify `DATA_PROVIDER_API` in your `.env` file;

## Tests

If you want update snapshot, you need run this code in work dir:

```bash
docker run --rm --network host -v $(pwd):/work/ -w /work/ -it mcr.microsoft.com/playwright:v1.40.0-jammy /bin/bash
npm i
npm run test:e2e:updateSnapshot
```
