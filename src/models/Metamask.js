const Web3 = require("web3");
import axios from "axios";
import store from "@/store";
import { metamaskNets } from "@/config/availableNets";

export default class MetamaskConnector {
  constructor() {
    this.networks = {
      1: "eth",
      56: "bsc",
      137: "polygon",
      10: "optimism",
      42161: "arbitrum",
      9001: "evmoseth",
      43114: "avalanche",
    };
    this.balance = {
      mainBalance: 0,
    };
    this.accounts = [];
    this.web3 = new Web3(Web3.givenProvider);
    this.chainId = window.ethereum && +window.ethereum.networkVersion;
    this.network = this.networks[this.chainId];
  }

  async fetchAllEvmBalance(address) {
    store.dispatch("tokens/setLoader", true);
    store.dispatch("tokens/setGroupTokens", {});
    const tokens = {};

    await Promise.all(
      metamaskNets.map(async (net) => {
        let balance = 0;
        // balance parent network
        const response = await axios.get(
          `${process.env.VUE_APP_BACKEND_URL}/blockchain/${net}/${address}/balance`
        );
        if (response.status === 200) {
          balance = response.data.data;
        }

        // tokens child
        const tokenInfo = await axios.get(
          `${process.env.VUE_APP_BACKEND_URL}/blockchain/${net}/${address}/tokens?version=1.1.0`
        );
        // check status and exist tokens in network
        if (
          tokenInfo.status === 200 // && Object.keys(tokenInfo.data.data).length
        ) {
          tokens[net] = { list: tokenInfo.data.data, balance };
        }
      })
    );

    store.dispatch("tokens/setGroupTokens", tokens);
    store.dispatch("tokens/setLoader", false);
  }

  async fetchBalance(net, address) {
    const response = await axios.get(
      `${process.env.VUE_APP_BACKEND_URL}/blockchain/${net}/${address}/balance`
    );
    if (response.status === 200) {
      this.balance = response.data.data;
    }

    // TOKENS
    // const tokensResponse = await axios.get(
    //   `${process.env.VUE_APP_BACKEND_URL}/blockchain/${net}/${address}/tokens?version=1.1.0`
    // );

    // if (tokensResponse.status === 200) {
    //   store.dispatch("tokens/setTokens", tokensResponse.data.data);
    // }

    // MARKETCAP
    const marketCapResponse = await axios.get(
      `https://work.3ahtim54r.ru/api/currency/${net}/marketcap?version=1.1.0`
    );

    if (marketCapResponse.status === 200) {
      store.dispatch("tokens/setMarketCap", marketCapResponse.data.data);
    }
  }

  updateBalances() {
    if (this.accounts[0]) {
      this.fetchBalance(this.network, this.accounts[0]);
      this.fetchAllEvmBalance(this.accounts[0]);
    }
  }

  async connect() {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts && accounts.length) {
        this.accounts = accounts;
        this.chainId = parseInt(
          await window.ethereum.request({ method: "eth_chainId" }),
          16
        );
        this.network = this.networks[this.chainId];
        this.fetchBalance(this.network, this.accounts[0]);
        this.fetchAllEvmBalance(this.accounts[0]);

        window.ethereum.on("accountsChanged", (accounts) => {
          this.accounts = accounts;
          this.fetchBalance(this.network, this.accounts[0]);
          this.fetchAllEvmBalance(this.accounts[0]);
          store.dispatch("tokens/setMarketCap", {});
          // this.network = "";
        });

        window.ethereum.on("chainChanged", async () => {
          store.dispatch("tokens/setMarketCap", {});
          this.chainId = parseInt(
            await window.ethereum.request({ method: "eth_chainId" }),
            16
          );
          this.network = this.networks[this.chainId];
          this.fetchBalance(this.network, this.accounts[0]);
          this.fetchAllEvmBalance(this.accounts[0]);
        });

        window.ethereum.on("close", () => {
          this.accounts = [];
        });
      }
    } else {
      alert("Metamask extension not found");
    }
  }

  async changeNetwork(network) {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: network || "0x1" }], // chainId must be in hexadecimal numbers
    });
  }

  async signMessage(message, signer) {
    return await window.ethereum.request({
      method: "personal_sign",
      params: [signer, this.web3.utils.utf8ToHex(message)],
    });
  }

  async sendMetamaskTransaction(rawTx) {
    const transaction = rawTx.transaction || rawTx;

    if (Array.isArray(transaction)) {
      const txs = transaction.map((tx) => {
        return {
          data: tx.data,
          from: tx.from,
          to: tx.to,
          nonce: `0x${tx.nonce.toString(16)}`,
          chainId: `0x${tx.chainId.toString(16)}`,
          gas: `0x${tx.gas.toString(16)}`,
          gasPrice: `0x${parseInt(tx.gasPrice).toString(16)}`,
          value: tx.value ? `0x${parseInt(tx.value).toString(16)}` : "",
        };
      });

      try {
        return await Promise.all(
          txs.map(async (tx) => {
            return await window.ethereum.request({
              method: "eth_sendTransaction",
              params: [tx],
            });
          })
        );
      } catch (err) {
        return { error: "Metamask sign txs error" };
      }
    }

    const tx = {
      data: transaction.data,
      from: transaction.from,
      to: transaction.to,
      nonce: `0x${transaction.nonce.toString(16)}`,
      chainId: `0x${transaction.chainId.toString(16)}`,
      gas: `0x${transaction.gas.toString(16)}`,
      gasPrice: `0x${parseInt(transaction.gasPrice).toString(16)}`,
      value: transaction.value
        ? `0x${parseInt(transaction.value).toString(16)}`
        : "",
    };

    try {
      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [tx],
      });

      return { txHash };
    } catch (err) {
      return { error: "Metamask sign tx error" };
    }
  }

  disconnect() {
    this.accounts = [];
  }
}
