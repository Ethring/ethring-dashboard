# Change Log

## [Unreleased] [v1.0.1] - 13.02.2024

### Added ✅

-   `services/track-update-balance` for updating balance after transaction;

-   `store/update-balance` to store queue for updating balance;

-   Disable states for select, button, and input while transaction is preparing;

-   Get data from the IndexedDB and display it in the UI after get data from the API;

-   The basis for working with multiple wallets `store/tokens`;

-   Updating balance for tokens without balance;

-   Updating wallet balances from `modules/balance-provider` in `composition/useServices`;

-   `modules/balance-provider` for getting balances;

-   `services/indexed-db` for IndexedDB;

-   `modules/chain-configs` for getting chain configs;

-   Axios Instance for API requests;

-   Formatters for balances records;

-   Types, interfaces, and enums for the `modules/balance-provider`;

### Changed 📝

-   Balances provider from JS to TS;

-   Getting tokens list from sync to async;

-   Loaders for getting data from the API by account and chain;

-   Indexed DB version for 'balances' store has been changed to 2;

### Fixed 🛠️

-   Getting chain configs;

-   Getting tokens list;

-   Getting tokens list from provider;

-   Saving to `IndexedDB`;

-   Getting from IndexedDB;

-   `Axios` Instance for API requests;

-   Id for record in `IndexedDB`;

-   Waiting status for transaction preparation;

### Removed ❌

-   `api/data-provider`

-   `api/networks`

-   `compositions/useInit`

-   `shared/utils/balances`

-   `IBC.` from token symbol;
