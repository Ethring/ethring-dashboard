import useWeb3Onboard from '@/compositions/useWeb3Onboard';

export const onSelectNetwork = async (network) => {
    const { setChain, connectedWallet } = useWeb3Onboard();

    const { provider } = connectedWallet.value;

    const { chainId } = provider;

    try {
        await setChain({
            chainId: network.id || network.chain_id,
        });
    } catch (error) {
        await setChain({ chainId });
    }
};
