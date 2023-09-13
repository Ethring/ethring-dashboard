class AdapterBase {
    async connectWallet() {
        throw new Error('Method not implemented.');
    }

    async disconnectWallet() {
        throw new Error('Method not implemented.');
    }

    async disconnectAllWallets() {
        throw new Error('Method not implemented.');
    }

    async getCurrentAccount() {
        throw new Error('Method not implemented.');
    }

    async getCurrentChain() {
        throw new Error('Method not implemented.');
    }

    async getChainList() {
        throw new Error('Method not implemented.');
    }

    async setChain() {
        throw new Error('Method not implemented.');
    }

    async getAccount() {
        throw new Error('Method not implemented.');
    }

    async getMainWallets() {
        throw new Error('Method not implemented.');
    }

    getWalletLogo() {
        throw new Error('Method not implemented.');
    }
    validateAddress() {
        throw new Error('Method not implemented.');
    }
}

export default AdapterBase;
