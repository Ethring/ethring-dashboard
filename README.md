# Ethring

Ethring LSDFi & DeFi Aggregator Platform that enables yield farming in just a few clicks. We help protocols increase TVL, attract new audiences, and solve liquidity fragmentation by providing a unified end-to-end interface for asset management in a single application. We’re a non-custodial platform, utilizing cross-chain solutions to find the best routes in the DeFi space through dozens of providers. Our uniqueness lies in flexibility and scalability, supporting the integration of smart contracts, networks, and various standards;

## Use Cases

### DeFi Yield Generation (The Bag)
- **Deposit into Yield Vaults** – Start earning yield in just a few clicks—seamlessly deposit assets into automated, high-efficiency vaults.
- **Withdraw Yield Earnings** – Easily withdraw earned yields while maintaining full control over funds.
- **Optimized Routing** – Automatically constructs the most efficient transaction path to maximize the output amount while minimizing fees and slippage

### Earn & Yield Opportunities
- **Explore Yield Opportunities** – Explore 150+ LP-assets, 15+ protocols, and 5 networks available for earning.

### Cross-Chain & In-Network Transactions
- **Move Assets Between Networks** – Transfer assets seamlessly across different blockchains.
- **Batch Multiple Actions** – Execute swaps, bridge, staking, and yield farming in a single transaction, reducing gas fees.
- **Simulate Transactions** – Preview transactions before execution to optimize costs and avoid slippage.
- **Bridge Liquidity Across Networks** – Efficiently move liquidity between Layer 1 and Layer 2 networks.

### Dashboard
- **Monitor Portfolio Performance** – Get a unified view of assets, yields, and historical performance.
- **Update Balances** – Real-time updates of wallet and asset balances, reflecting all changes from transactions.

### Market Data
- **Fetch Live Asset Prices** – Access real-time price data from liquidity pools and AMMs.
- **TVL & APR Monitoring** – Track Total Value Locked (TVL) and Annual Percentage Rate (APR) for optimal yield farming.

### Transaction Monitoring (Soon)
- **Track Transactions in Real-Time** – Monitor wallet or contract movements as they happen.
- **Track Liquidity Positions** – Keep an eye on liquidity positions and adjust strategies dynamically.

### Protocols & Explore (Soon)
- **Discover & Integrate New DeFi Protocols** – Find new yield opportunities and innovative DeFi solutions. 

## Tech Stack

### Frontend
- **Vue 3**: Used for building the user interface with a modern and reactive framework;
- **Composition API**: Enables better organization and reusability of logic within components;
- **Vuex**: State management for handling global application state and API data;
- **Ant Design Vue**: Provides pre-built UI components like skeleton loaders, tooltips, and layout elements;
- **SCSS**: For styling components with modular and maintainable CSS;

## Main Parts Of Project

- **Core API**: is a main module for obtaining **network configurations and tokens** in various blockchains;
- **Wallet adapter**: is a module for interacting with web 3 wallets in various ecosystems based on [Blocknative](https://onboard.blocknative.com/);
- **Operation Bag**: is a module for interacting with transactions from a single location;
- **Transaction Manager**: is a module for tracking transactions on the blockchain;
- **Bridge Dex**: is a module for obtaining routes to perform a **bridge/dex** transaction;


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

### Important `DATA_PROVIDER_API`

To get the balance for the account, please specify `DATA_PROVIDER_API` in your `.env` file;

## Tests

If you want update snapshot, you need run this code in work dir:

```bash
docker run --rm --network host -v $(pwd):/work/ -w /work/ -it mcr.microsoft.com/playwright:v1.40.0-jammy /bin/bash
npm i
npm run test:e2e:updateSnapshot
```
