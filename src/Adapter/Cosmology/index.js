/* eslint-disable no-unused-vars */
import WalletInterface from '@/Adapter/utils/WalletInterface';
import { ECOSYSTEMS } from '@/Adapter/config';

import { Logger, WalletManager } from '@cosmos-kit/core';
import { chains, assets, ibc } from 'chain-registry';
import { wallets as KeplrWallets } from '@cosmos-kit/keplr';
import { wallets as LeapWallets } from '@cosmos-kit/leap';

import _ from 'lodash/array';

// import { cosmos } from 'juno-network';

const EXPLORER_KIND = 'mintscan';
const [KeplrExtension, KeplrMobile] = KeplrWallets;
const [LeapExtension, LeapMobile] = LeapWallets;

const mainNets = chains.filter(
    (chain) =>
        chain.network_type === 'mainnet' &&
        chain.status === 'live' &&
        chain.chain_id &&
        chain.explorers.find((explorer) => explorer.kind === EXPLORER_KIND) &&
        chain.staking
);

const logger = new Logger();
const cosmology = new WalletManager(mainNets, assets, [KeplrExtension, LeapExtension], logger);

class CosmosAdapter extends WalletInterface {
    currentWallet = null;

    constructor() {
        super();
    }

    async connectWallet(walletName, chain = 'cosmoshub') {
        const wallet = cosmology.getMainWallet(walletName);
        wallet.emitter.setMaxListeners(100);
        await wallet.initClient();
        await this.changeChain(wallet, chain);
        // await this.enableAll();
        // console.log('wallet', wallet);
        return this.currentWallet.isDone;
    }

    async setChain(chainInfo) {
        const { walletName, chain } = chainInfo;
        return await this.connectWallet(walletName, chain);
    }

    getMainWallets() {
        return cosmology.mainWallets || [];
    }

    async disconnectWallet() {}

    async disconnectAllWallets() {
        await this.currentWallet?.disconnect(true);
        this.currentWallet = null;
    }

    getAccount() {
        return this.currentWallet?.address || null;
    }

    getCurrentChain() {
        const chainInfo = this.currentWallet?.chain;
        const walletInfo = this.currentWallet?.walletInfo;

        if (!chainInfo || !walletInfo) {
            return null;
        }

        return {
            ...chainInfo,
            walletName: walletInfo.name,
            walletPrettyName: walletInfo.prettyName,
            net: chainInfo.chain_id,
            chain_id: chainInfo.chain_name,
            ecosystem: ECOSYSTEMS.COSMOS,
            logo: chainInfo.logo_URIs?.png || chainInfo.logo_URIs?.svg || null,
        };
    }

    getChainList() {
        const chainList = cosmology.chainRecords.map((record) => {
            const { chain } = record;
            const chainRecord = {
                chain_id: chain.chain_name,
                name: chain.pretty_name,
                logo: chain.logo_URIs?.png || chain.logo_URIs?.svg || null,
            };
            return chainRecord;
        });

        return chainList;
    }

    // async enableAll() {
    //     console.log('enableAll', this.currentWallet);
    //     const { emitter } = this.currentWallet;
    //     // set max listener to avoid memory leak
    //     emitter.setMaxListeners(100);
    //     const enableAll = mainNets.map((chain) => this.currentWallet.client.enable(chain.chain_id));
    //     const chunked = _.chunk(enableAll, 5);
    //     console.log('chunked', chunked);
    //     for (const chunk of chunked) {
    //         await Promise.all(chunk)
    //             .then(function (arrayOfValuesOrErrors) {
    //                 // console.log('arrayOfValuesOrErrors', arrayOfValuesOrErrors);
    //                 // handling of my array containing values and/or errors.
    //             })
    //             .catch(function (err) {
    //                 console.log('PROMISE', err.message); // some coding error in handling happened
    //             });
    //         // const chain_id = error.message.split(CHAIN_NOT_FOUND)[1];
    //         // // find chain by chain_id
    //         // const chain = mainNets.find((chain) => chain.chain_id === chain_id);
    //         // const { chain_name } = chain;
    //         // const chainInfo = cosmology.getWalletRepo(chain_name);
    //         // console.log('chain_id', chain_id, chainInfo);
    //         // await chainInfo.getWallet(this.currentWallet.walletInfo.name).initClient();
    //     }
    //     console.log('enableAll done');
    // }

    async changeChain(wallet, chain) {
        const chainWallet = wallet.getChainWallet(chain);
        await chainWallet.initClient();
        await chainWallet.connect(true);
        this.currentWallet = chainWallet;
    }

    getWalletLogo() {
        return this.currentWallet?.walletInfo?.logo || null;
    }
}

export default new CosmosAdapter();

// if (!walletRepo) {
//     // print chainIds
//     // console.log('chainIds', chainIds, '\n\n\n');
//     // console.log('if ', wallet);
//     // const allChains = [...wallet.chainWalletMap.keys()];
//     const chainWallet = wallet.chainWalletMap.get('bandchain');
//     console.log('cosmos', cosmology);
//     await chainWallet.initClient();
//     await chainWallet.connect(true);
//     try {
//         console.log('call enable', chainIds);
//         await Promise.all(chainIds.map((chainId) => chainWallet.client.enable(chainId)));
//     } catch (error) {
//         if (error.message.includes(CHAIN_NOT_FOUND)) {
//             const chain_id = error.message.split(CHAIN_NOT_FOUND)[1];
//             const [chain] = chain_id.split('-');
//             console.log('chain', chain);
//             console.log('error 112341234', chain_id, wallet, cosmology.getChainRecord(chain_id));
//             // add chain. info
//             const chainInfo = cosmology.getWalletRepo(chain);
//             console.log('chainInfo before', chainInfo.chainRecord);
//             await chainInfo.getWallet(walletName).connect(true);
//             console.log('chainInfo after', chainInfo.chainRecord);
//             await chainWallet.client.addChain(chainInfo.chainRecord);
//         }
//     }
//     this.currentWallet = chainWallet;

//     // chainW.client.enable();

//     return;
// }
