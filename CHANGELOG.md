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

-   `Operation result` for Send, Swap, Bridge and SuperSwap;

-   `components/ui/result` for displaying operation result;

-   Ignore some RPC domains for COSMOS ecosystem;

### Changed 📝

-   Balances provider from JS to TS;

-   Getting tokens list from sync to async;

-   Loaders for getting data from the API by account and chain;

-   Indexed DB version for 'balances' store has been changed to 2;

-   Notifications styles;

-   Adding custom icons for notifications moved to `compositions/useNotifications`;

-   `CLEAR_AMOUNTS` action for clearing amounts after transaction has been disabled;

### Fixed 🛠️

-   Getting chain configs on the first load;

-   Getting tokens list on the first load;

-   Getting tokens list from provider;

-   Getting tokens list for selected chain;

-   Saving to `IndexedDB` after getting data from the API;

-   Getting from IndexedDB;

-   `Axios` Instance for API requests;

-   `ID` for record in `IndexedDB`;

-   Waiting status for transaction preparation;

-   Clearing values after transaction;

-   Getting Sign Client for COSMOS ecosystem;

### Removed ❌

-   `api/data-provider`

-   `api/networks`

-   `compositions/useInit`

-   `shared/utils/balances`

-   `IBC.` from token symbol;

-   Custom Icons for notifications from modules (SWAP, SEND, BRIDGE, SUPER_SWAP);

-   Clearing values after transaction;
