import useAdapter from '@/Adapter/compositions/useAdapter';

export const onSelectNetwork = async (network) => {
    const { setChain, currentChainInfo } = useAdapter();

    const chainId = currentChainInfo.value?.chain_id;

    try {
        await setChain({
            chainId: network.id || network.chain_id,
        });
    } catch (error) {
        await setChain({ chainId });
    }
};
