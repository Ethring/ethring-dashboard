class AdapterBase {
    static async connectWallet() {
        throw new Error('Method not implemented.');
    }

    static async disconnectWallet() {
        throw new Error('Method not implemented.');
    }

    static async disconnectAllWallets() {
        throw new Error('Method not implemented.');
    }

    static async getCurrentAccount() {
        throw new Error('Method not implemented.');
    }

    static async getCurrentChain() {
        throw new Error('Method not implemented.');
    }

    static async getChainList() {
        throw new Error('Method not implemented.');
    }

    static async setChain() {
        throw new Error('Method not implemented.');
    }

    static async getAccount() {
        throw new Error('Method not implemented.');
    }

    static async getMainWallets() {
        throw new Error('Method not implemented.');
    }

    static getWalletLogo() {
        throw new Error('Method not implemented.');
    }

    static validateAddress() {
        throw new Error('Method not implemented.');
    }

    static async prepareDelegateTransaction() {
        throw new Error('Method not implemented.');
    }

    static async getSignClientByChain() {
        throw new Error('Method not implemented.');
    }
}

export default AdapterBase;
