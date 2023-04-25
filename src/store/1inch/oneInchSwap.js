import axios from "axios";

// const types = {};

export default {
  namespaced: true,
  state: () => ({}),

  getters: {},

  mutations: {},

  actions: {
    /* ESTIMATE SWAP */
    async estimateSwap(
      _,
      { net, from_token_address, to_token_address, amount }
    ) {
      let response;

      try {
        response = await axios.get(
          `${process.env.VUE_APP_1INCH_SWAP_API}estimateSwap`,
          {
            params: {
              net,
              from_token_address,
              to_token_address,
              amount,
            },
          }
        );
        console.log("estimate", response.data.data);
        return response.data.data;
      } catch (err) {
        return { error: err.response.data.error };
      }
    },

    /* ALLOWANCE */
    async getAllowance(_, { net, token_address, owner }) {
      let response;

      try {
        response = await axios.get(
          `${process.env.VUE_APP_1INCH_SWAP_API}getAllowance`,
          {
            params: {
              net,
              token_address,
              owner,
            },
          }
        );
        return response.data.data;
      } catch (err) {
        return { error: err.response.data.error };
      }
    },

    /* APPROVE TX */
    async getApproveTx(_, { net, token_address, owner }) {
      let response;

      try {
        response = await axios.get(
          `${process.env.VUE_APP_1INCH_SWAP_API}getApproveTx`,
          {
            params: {
              net,
              token_address,
              owner,
            },
          }
        );
        console.log("getApproveTx", response.data.data);
        return response.data.data;
      } catch (err) {
        return { error: err.response.data.error };
      }
    },

    /* GET SWAP TX */
    async getSwapTx(
      _,
      { net, from_token_address, to_token_address, amount, owner, slippage }
    ) {
      let response;

      try {
        response = await axios.get(
          `${process.env.VUE_APP_1INCH_SWAP_API}getSwapTx`,
          {
            params: {
              net,
              from_token_address,
              to_token_address,
              amount,
              owner,
              slippage,
            },
          }
        );
        console.log("getSwapTx", response.data.data);
        return response.data.data;
      } catch (err) {
        return { error: err.response.data.error };
      }
    },
  },
};
