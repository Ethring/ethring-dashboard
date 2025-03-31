import Web3 from 'web3';

export const getContract = (address, rpc, abi) => {
    const httpProvider = new Web3.providers.HttpProvider(rpc);
    const web3NoAccount = new Web3(httpProvider);
    const contract = new web3NoAccount.eth.Contract(abi, address);
    return contract;
};
