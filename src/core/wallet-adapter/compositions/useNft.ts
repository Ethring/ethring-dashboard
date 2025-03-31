import moment from 'moment';
import axios from 'axios';
import BigNumber from 'bignumber.js';

import { watch, computed, ref } from 'vue';

import useAdapter from '@/core/wallet-adapter/compositions/useAdapter';
import { Ecosystem } from '@/shared/models/enums/ecosystems.enum';

import { contracts } from 'stargazejs';

import { CosmosAdapter } from '../ecosystems/cosmos';
import { EthereumAdapter } from '../ecosystems/ethereum';

import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';

import { SigningStargateClient } from '@cosmjs/stargate';
import { ConfigExtension, ConfigResponse, MintPriceResponse } from 'stargazejs/types/codegen/VendingMinter.types';
import { CollectionInfoResponse } from 'stargazejs/types/codegen/SG721Base.types';
import { VendingMinterQueryClient } from 'stargazejs/types/codegen/VendingMinter.client';
import { useStore } from 'vuex';
import { IShortcutOp } from '@/core/shortcuts/core/ShortcutOp';
import OperationsFactory from '@/core/operations/OperationsFactory';
import { SHORTCUT_STATUSES } from '@/shared/models/enums/statuses.enum';
import { ModuleType } from '@/shared/models/enums/modules.enum';
import { delay } from '@/shared/utils/helpers';

interface IUseNFT {
    adapter: CosmosAdapter | EthereumAdapter | null;
    getCollectionInfo: (chain: string, contractAddress: string) => Promise<any>;

    getMintedTokensImage: (
        chain: string,
        contractAddress: string,
        { owner, tokenIds, callCount }: { owner?: string; tokenIds?: string[]; callCount?: number },
    ) => Promise<string[] | undefined>;
}

export interface INftStatsValue {
    type: 'currency' | 'usd';
    value: string | number;
    symbol: string;
}

export interface INftStats {
    type: string;
    value: INftStatsValue | string;
}

interface CustomConfigResponse extends ConfigExtension, ConfigResponse {
    end_time: string;
}

interface IPriceInfo {
    currency: {
        amount: string;
        symbol: string;
    };
    usd: {
        amount: string;
        symbol: string;
    };
}

export interface INftCollectionStats {
    type: string;
    stats: INftStats[];
    priceInfo: IPriceInfo;
    isSoldOut: boolean;
}

export interface INftCollectionInfo {
    type: string;
    stats: INftStats[];
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

    priceInfo: IPriceInfo;
}

export default function useNft(ecosystem: 'EVM' | 'COSMOS'): IUseNFT {
    const store = useStore();
    const { getAdapterByEcosystem } = useAdapter();

    const adapter = getAdapterByEcosystem(ecosystem as any);

    const currentShortcutId = computed(() => store.getters['shortcuts/getCurrentShortcutId']);

    const userAlreadyMinted = ref(0);
    const perAddressLimit = ref(0);

    const currentOp = computed<IShortcutOp>(() => {
        if (!currentShortcutId.value) return;
        return store.getters['shortcuts/getCurrentOperation'](currentShortcutId.value);
    });

    const operationsFactory = computed<OperationsFactory>(() => {
        if (!currentShortcutId.value) return;
        return store.getters['shortcuts/getShortcutOpsFactory'](currentShortcutId.value);
    });

    const isRequestingNfts = computed({
        get: () => store.getters['shortcuts/getIsRequestingNfts'](currentShortcutId.value),
        set: (value) =>
            store.dispatch('shortcuts/setIsRequestingNfts', {
                shortcutId: currentShortcutId.value,
                value,
            }),
    });

    const isShortcutLoading = computed({
        get: () => store.getters['shortcuts/getIsShortcutLoading'](currentShortcutId.value),
        set: (value) =>
            store.dispatch('shortcuts/setIsShortcutLoading', {
                shortcutId: currentShortcutId.value,
                value,
            }),
    });

    const shortcutStatus = computed(() => store.getters['shortcuts/getShortcutStatus'](currentShortcutId.value));

    const getClient = async (
        chain: string,
    ): Promise<{ client: SigningStargateClient | null; cosmWasmClient: CosmWasmClient | null; rpc: string }> => {
        try {
            if ([Ecosystem.EVM].includes(ecosystem as any)) return { client: null, cosmWasmClient: null, rpc: '' };
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

        const { share } = royalty_info || { share: 0 };

        const royalties = BigNumber(share || 0)
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
        const minted: string = `${mintedCount}`;

        let mintedPercentage: string = '';

        let isSoldOut = false;

        try {
            const mintableNumTokens = await queryClient.mintableNumTokens();

            const { count: remainingTokensCount } = mintableNumTokens;

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
        }

        // * PRICE *

        const nativeToken = store.getters['configs/getNativeTokenByChain'](chain, Ecosystem.COSMOS);

        const { symbol, decimals, price } = nativeToken || {};

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

        stats.push(priceStats);

        const priceInfo = {
            currency: {
                amount: priceDisplayAmount,
                symbol: nativeToken.symbol,
            },
            usd: {
                amount: BigNumber(priceDisplayAmount).multipliedBy(price).toString(),
                symbol: 'usd',
            },
        };

        return {
            type: nftType,
            stats,
            priceInfo,
            isSoldOut,
        };
    };

    const getMintedTokensImage = async (
        chain: string,
        contractAddress: string,
        { owner, tokenIds, callCount }: { owner?: string; tokenIds?: string[]; callCount?: number },
    ): Promise<string[] | undefined> => {
        const images: string[] = [];
        let collectionImg: string = '';

        // * FILL IMAGES BY COUNT *
        const fillImagesByCount = (): void => {
            if (!callCount) return;
            if (!collectionImg) return;
            for (let i = 0; i < callCount; i++) images.push(collectionImg);
        };

        // * GET IMAGES FROM IDS *
        const getImagesFromIds = async (mediaQueryClient: any) => {
            if (!tokenIds) return [];
            if (tokenIds && !tokenIds.length) return;

            for (const token of tokenIds) {
                const nftInfo = await mediaQueryClient.nftInfo({ tokenId: token });
                if (!nftInfo.token_uri) continue;
                await getImage(nftInfo.token_uri);
            }
        };

        // * GET IMAGE BY URI *
        const getImage = async (uri: string) => {
            const formattedTokenUri = uri.replace('ipfs://', 'https://ipfs.io/ipfs/');
            console.log('FORMATTED URI', formattedTokenUri);

            // regex to get extension
            const match = formattedTokenUri.match(/\.\w{3,4}($|\?)/gm);
            const extension = match ? match[0].replace('.', '') : '';

            const isCorrectExtension = ['png', 'jpeg', 'jpg', 'gif'].includes(extension);

            if (isCorrectExtension) return images.push(formattedTokenUri);

            try {
                const response = await axios.get(formattedTokenUri, { timeout: 3000 });

                const { data } = response || {};

                if (typeof data === 'object' && data && data.image) {
                    const formattedNftImg = data.image.replace('ipfs://', 'https://ipfs.io/ipfs/');
                    return images.push(formattedNftImg);
                }

                collectionImg && images.push(collectionImg);
            } catch (error) {
                console.warn('Error getting image', error);
                collectionImg && images.push(collectionImg);
            }
        };

        try {
            const { cosmWasmClient } = await getClient(chain);
            if (!cosmWasmClient) return [];

            const { SG721MetadataOnchain } = contracts;
            const { SG721MetadataOnchainQueryClient } = SG721MetadataOnchain;
            const mediaQueryClient = new SG721MetadataOnchainQueryClient(cosmWasmClient, contractAddress);

            const collectionInfo = await mediaQueryClient.collectionInfo();

            const { image } = collectionInfo || {};
            collectionImg = image.replace('ipfs://', 'https://ipfs.io/ipfs/');

            if (!owner) return [];

            // * GET IMAGES BY CONDITIONS
            // * If tokenIds are provided, get images by tokenIds
            // * If tokenIds are not provided, set collection image by callCount

            if (tokenIds && tokenIds.length) fillImagesByCount();
            else await getImagesFromIds(mediaQueryClient);

            return images || [];
        } catch (error) {
            console.error('Error while getting images for NFTs', error);
        }
    };

    const getCollectionInfo = async (chain: string, contractAddress: string): Promise<INftCollectionInfo | void> => {
        const minterAddress = ref<string>('');

        try {
            isShortcutLoading.value = true;

            const { cosmWasmClient } = await getClient(chain);
            if (!cosmWasmClient) {
                console.warn('CosmWasmClient not found');
                return;
            }

            const { SG721Base, VendingMinter } = contracts;

            const { SG721BaseQueryClient } = SG721Base;
            const { VendingMinterQueryClient } = VendingMinter;

            const baseQueryClient = new SG721BaseQueryClient(cosmWasmClient, contractAddress);

            // * BASE QUERY By Collection *
            const [collectionInfoData, minterInfo, mintedTokensCount] = await Promise.all([
                baseQueryClient.collectionInfo(),
                baseQueryClient.minter(),
                baseQueryClient.numTokens(),
            ]);

            minterAddress.value = minterInfo.minter;

            if (!minterAddress.value) return;

            const vendingMinterQueryClient = new VendingMinterQueryClient(cosmWasmClient, minterAddress.value);

            // * MINTER QUERY By Collection Minter *
            const [minterConfig, mintPrice, startTime] = await Promise.all([
                vendingMinterQueryClient.config(),
                vendingMinterQueryClient.mintPrice(),
                vendingMinterQueryClient.startTime(),
            ]);

            const { start_time } = startTime || {};
            const { end_time } = minterConfig as CustomConfigResponse;
            const { per_address_limit, num_tokens = 0 } = minterConfig;

            perAddressLimit.value = per_address_limit;

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

            let userAddress = '';

            if (currentOp.value?.id) {
                const operation = operationsFactory.value.getOperationById(currentOp.value.id);
                operation && (userAddress = operation.getAccount());
            }

            let availablePerAddressLimit = per_address_limit;

            try {
                const userMinterCount = await vendingMinterQueryClient.mintCount({ address: userAddress });
                const { count = 0 } = userMinterCount;

                userAlreadyMinted.value = count;

                const userMinterCountStats = {
                    type: 'User minted',
                    value: {
                        type: 'currency',
                        value: count,
                        symbol: `/${per_address_limit}`,
                    },
                } as INftStats;

                availablePerAddressLimit = per_address_limit - count;

                collectionStats.push(userMinterCountStats);
            } catch (error) {
                console.log('Missing userMinterCount');
            }

            // * STATS *
            const response: INftCollectionInfo = {
                stats: collectionStats,
                type: stats.type,
                isSoldOut: stats.isSoldOut,

                collectionAddress: contractAddress,
                minterAddress: minterAddress.value,

                time: {
                    startTime: moment.unix(+start_time).format('YYYY-MM-DD HH:mm:ss'),
                    endTime: '',
                },

                funds,
                priceInfo: stats.priceInfo,
                perAddressLimit: availablePerAddressLimit,
            };

            if (end_time) response.time.endTime = moment.unix(+end_time.slice(0, 10)).format('YYYY-MM-DD HH:mm:ss');

            if (currentOp.value?.id && minterAddress.value) {
                const operation = operationsFactory.value.getOperationById(currentOp.value.id);
                operation && operation.setParamByField('collectionAddress', contractAddress);
                operation && operation.setParamByField('minterAddress', minterAddress.value);
            }

            return response;
        } catch (error) {
            console.error(error);
        } finally {
            isShortcutLoading.value = false;
        }
    };

    watch(shortcutStatus, async () => {
        if (shortcutStatus.value !== SHORTCUT_STATUSES.SUCCESS) return;

        isRequestingNfts.value = true;

        for (const op of operationsFactory.value.getOperationOrder()) {
            const operation = operationsFactory.value.getOperationByKey(op);

            if (!operation) continue;
            if (![ModuleType.nft].includes(operation.getModule() as ModuleType)) continue;

            const contractAddress = operation.getParamByField('contract');
            const chain = operation.getChainId();
            const account = operation.getAccount();

            const tokenIds = operation.getParamByField('tokenIds') || [];
            const count = operation.getParamByField('count');

            console.log('getting collection info', {
                chain,
                contractAddress,
                account,
                tokenIds,
                count,
            });

            if (count <= 0 || !tokenIds.length) continue;

            const nfts = (await getMintedTokensImage(chain, contractAddress, { owner: account, callCount: count, tokenIds })) || [];

            if (!nfts.length) continue;

            operation.setParamByField('nfts', nfts);

            console.log('NFT IMAGES', nfts);
        }

        await delay(1000);
        isRequestingNfts.value = false;
    });

    return {
        adapter,
        getCollectionInfo,
        getMintedTokensImage,
    };
}
