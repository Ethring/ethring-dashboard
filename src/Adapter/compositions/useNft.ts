import moment from 'moment';

import { computed, ref } from 'vue';
import BigNumber from 'bignumber.js';

import useAdapter from '@/Adapter/compositions/useAdapter';
import { ECOSYSTEMS } from '@/Adapter/config';

import { contracts } from 'stargazejs';

import { CosmosAdapter } from '../ecosystems/cosmos';
import { EthereumAdapter } from '../ecosystems/ethereum';

import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';

import { SigningStargateClient } from '@cosmjs/stargate';
import { ConfigExtension, ConfigResponse, MintPriceResponse } from 'stargazejs/types/codegen/VendingMinter.types';
import { CollectionInfoResponse } from 'stargazejs/types/codegen/SG721Base.types';
import { VendingMinterQueryClient } from 'stargazejs/types/codegen/VendingMinter.client';
import { useStore } from 'vuex';
import { IShortcutOp } from '../../modules/shortcuts/core/ShortcutOp';
import OperationsFactory from '@/modules/operations/OperationsFactory';

type ECOSYSTEMS_TYPE = keyof typeof ECOSYSTEMS;

interface IUseNFT {
    adapter: CosmosAdapter | EthereumAdapter | null;
    getCollectionInfo: (chain: string, contractAddress: string) => Promise<any>;
}

interface INftStatsValue {
    type: 'currency' | 'usd';
    value: string | number;
    symbol: string;
}

interface INftStats {
    type: string;
    value: INftStatsValue | string;
}

interface CustomConfigResponse extends ConfigExtension, ConfigResponse {
    end_time: string;
}

export interface INftCollectionStats {
    type: string;
    stats: INftStats[];
    priceStats: INftStats;
    price: string;
    isSoldOut: boolean;
}

export interface INftCollectionInfo {
    type: string;
    stats: INftStats[];
    priceStats: INftStats;
    price: string;
    perAddressLimit: number;

    collectionAddress: string;
    minterAddress: string;

    isSoldOut: boolean;

    time: {
        startTime: string;
        endTime: string;
    };

    funds: {
        amount: string;
        denom: string;
    };
}

export default function useNft(ecosystem: ECOSYSTEMS_TYPE): IUseNFT {
    const store = useStore();
    const { getAdapterByEcosystem, getChainByChainId } = useAdapter();

    const adapter = getAdapterByEcosystem(ecosystem);

    const currentShortcutId = computed(() => store.getters['shortcuts/getCurrentShortcutId']);

    const currentOp = computed<IShortcutOp>(() => {
        if (!currentShortcutId.value) return;
        return store.getters['shortcuts/getCurrentOperation'](currentShortcutId.value);
    });

    const operationsFactory = computed<OperationsFactory>(() => {
        if (!currentShortcutId.value) return;
        return store.getters['shortcuts/getShortcutOpsFactory'](currentShortcutId.value);
    });

    const isShortcutLoading = computed({
        get: () => store.getters['shortcuts/getIsShortcutLoading'](currentShortcutId.value),
        set: (value) =>
            store.dispatch('shortcuts/setIsShortcutLoading', {
                shortcutId: currentShortcutId.value,
                value,
            }),
    });

    const getClient = async (
        chain: string,
    ): Promise<{ client: SigningStargateClient | null; cosmWasmClient: CosmWasmClient; rpc: string }> => {
        try {
            if ([ECOSYSTEMS.EVM].includes(ecosystem)) return { client: null, cosmWasmClient: null, rpc: '' };
            const { client, rpc } = (await adapter.getSignClientByChain(chain)) || { client: null, rpc: '' };
            const cosmWasmClient = await CosmWasmClient.connect(rpc);

            return {
                client,
                rpc,
                cosmWasmClient,
            };
        } catch (error) {
            console.error('Error getting client', error);
            throw new Error('Error getting client');
        }
    };

    const getNftType = (totalCount: number) => {
        if (totalCount === 0) return 'Open edition';
        return 'Public sale';
    };

    const generateNftStats = async ({
        chain,
        collection,
        mintPrice,
        mintedCount,
        totalCount,
        queryClient,
    }: {
        chain: string;
        collection: CollectionInfoResponse;
        mintPrice: MintPriceResponse;
        mintedCount: number;
        totalCount: number;
        queryClient: VendingMinterQueryClient;
    }): Promise<INftCollectionStats> => {
        isShortcutLoading.value = true;

        const stats: INftStats[] = [];

        // * QUANTITY *
        const quantityValueUnlimited = 'Unlimited';

        const quantityValue: INftStatsValue = {
            type: 'currency',
            value: totalCount,
            symbol: '',
        };

        stats.push({
            type: 'Quantity',
            value: totalCount === 0 ? quantityValueUnlimited : quantityValue,
        });

        const nftType = getNftType(totalCount);

        const { royalty_info } = collection;

        const royalties = BigNumber(royalty_info.share || 0)
            .multipliedBy(100)
            .decimalPlaces(2);

        // * ROYALTIES *

        stats.push({
            type: 'Royalties',
            value: {
                type: 'currency',
                value: royalties.toString(),
                symbol: '%',
            },
        });

        // * MINTED *
        let minted: string = `${mintedCount}`;

        let mintedPercentage: string = '';

        let isSoldOut = false;

        try {
            const mintableNumTokens = await queryClient.mintableNumTokens();

            const { count: remainingTokensCount } = mintableNumTokens;

            console.log('remainingTokensCount', remainingTokensCount);
            isSoldOut = !remainingTokensCount;

            mintedPercentage = BigNumber(totalCount || 0)
                .minus(remainingTokensCount)
                .div(totalCount)
                .multipliedBy(100)
                .decimalPlaces(0, BigNumber.ROUND_DOWN)
                .toString();

            mintedPercentage = `(${mintedPercentage}%)`;
        } catch (error) {
            console.log('Missing mintableNumTokens, using default minted percentage');
        } finally {
            stats.push({
                type: 'Minted',
                value: {
                    type: 'currency',
                    value: minted,
                    symbol: mintedPercentage,
                },
            });

            isShortcutLoading.value = false;
        }

        // * PRICE *

        const chainInfo = getChainByChainId(ECOSYSTEMS.COSMOS, chain);

        const { asset } = chainInfo || {};
        const { decimals, symbol } = asset || {};

        const priceRawAmount = mintPrice.current_price.amount || '0';
        const priceDisplayAmount = BigNumber(priceRawAmount).dividedBy(BigNumber(10).pow(decimals)).toString();

        const priceStats: INftStats = {
            type: 'Price',
            value: {
                type: 'currency',
                value: priceDisplayAmount,
                symbol,
            },
        };

        return {
            type: nftType,
            stats,
            priceStats,
            price: priceDisplayAmount,
            isSoldOut,
        };
    };

    const getCollectionInfo = async (chain: string, contractAddress: string): Promise<INftCollectionInfo> => {
        const minterAddress = ref(null);

        console.log('isShortcutLoading', isShortcutLoading.value, ' for shortcut', currentShortcutId.value);
        isShortcutLoading.value = true;

        try {
            const { client, rpc, cosmWasmClient } = await getClient(chain);

            const { SG721Base, VendingMinter } = contracts;

            const { SG721BaseQueryClient } = SG721Base;
            const { VendingMinterQueryClient } = VendingMinter;

            const baseQueryClient = new SG721BaseQueryClient(cosmWasmClient, contractAddress);

            // * BASE QUERY By Collection *
            const [contractInfo, collectionInfoData, minterInfo, mintedTokensCount] = await Promise.all([
                baseQueryClient.contractInfo(),
                baseQueryClient.collectionInfo(),
                baseQueryClient.minter(),
                baseQueryClient.numTokens(),
            ]);

            const baseQuery = {
                contractInfo,
                collectionInfoData,
                minterInfo,
                mintedTokensCount,
            };

            minterAddress.value = minterInfo.minter;

            if (!minterAddress.value) return null;

            const vendingMinterQueryClient = new VendingMinterQueryClient(cosmWasmClient, minterAddress.value);

            // * MINTER QUERY By Collection Minter *
            const [minterConfig, mintPrice, startTime] = await Promise.all([
                vendingMinterQueryClient.config(),
                vendingMinterQueryClient.mintPrice(),
                vendingMinterQueryClient.startTime(),
            ]);

            const minterQuery = {
                minterConfig,
                mintPrice,
                startTime,
            };

            const { start_time } = startTime || {};
            const { end_time } = minterConfig as CustomConfigResponse;
            const { per_address_limit, num_tokens = 0 } = minterConfig;

            const stats = await generateNftStats({
                chain,
                collection: collectionInfoData,
                mintPrice,
                mintedCount: mintedTokensCount.count,
                totalCount: num_tokens,
                queryClient: vendingMinterQueryClient,
            });

            const { stats: collectionStats } = stats;

            const funds = mintPrice.current_price;

            // * STATS *

            const response: INftCollectionInfo = {
                stats: collectionStats,
                priceStats: stats.priceStats,
                type: stats.type,
                isSoldOut: stats.isSoldOut,

                collectionAddress: contractAddress,
                minterAddress: minterAddress.value,

                time: {
                    startTime: moment.unix(+start_time).format('YYYY-MM-DD HH:mm:ss'),
                    endTime: '',
                },

                funds,
                price: stats.price,
                perAddressLimit: per_address_limit,
            };

            if (end_time) {
                response.time.endTime = moment.unix(+end_time.slice(0, 10)).format('YYYY-MM-DD HH:mm:ss');
            }

            if (currentOp.value?.id) {
                operationsFactory.value.getOperationById(currentOp.value.id).setParamByField('funds', funds);
            }

            console.log('FINAL COLLECTION INFO');
            console.log(baseQuery);
            console.log(minterQuery);
            console.log(stats);
            console.log(response);
            console.log('---------------------------');

            return response;
        } catch (error) {
            console.error(error);
        } finally {
            isShortcutLoading.value = false;
            console.log('isShortcutLoading', isShortcutLoading.value, ' for shortcut', currentShortcutId.value);
        }
    };

    return {
        adapter,
        getCollectionInfo,
    };
}
