# Core Functionality

This folder contains the core functionality of the Zomet Dashboard project.

## Table of Contents

-   [Description](#description)
-   [Main Components](#main-components)
    -   [Modules](#modules)
        -   [`transaction-manager`](#transaction-manager)
        -   [`wallet-adapter`](#wallet-adapter)
        -   [`operations`](#operations)
        -   [`shortcuts`](#shortcuts)
        -   [`balance-provider`](#balance-provider)

## Description

The `core` folder houses the essential components and modules that form the backbone of the Zomet Dashboard project. It includes the main logic, utilities, and core functionalities that are used throughout the application.

## Main Components

### Modules

#### `transaction-manager`

This module is responsible for managing transactions in the application. It provides functions to create, update, sign, and send transactions to the blockchain.

#### `wallet-adapter`

This module is responsible for interfacing with the Web3 wallets used in the application. It provides functions to connect to a wallet, get the user's address, and sign transactions.

#### `operations`

This module contains the main logic for the application. It provides interfaces to interact with several types of operations, such as TRANSFER, MINT, BRIDGE, etc.

#### `shortcuts`

This module provides shortcuts to common operations and functionalities in the application. It includes functions to transfer tokens, mint tokens, etc.

#### `balance-provider`

This module is responsible for providing the user's balance information. It fetches the user's balance from the blockchain and caches it for quick access.

// TODO: Add more details about each module
