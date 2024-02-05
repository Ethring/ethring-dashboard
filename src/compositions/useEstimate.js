import { estimateSwap, estimateBridge } from '@/api/services';

export default function useEstimate({
    moduleType,
    selectedService,
    selectedSrcToken,
    selectedDstToken,
    selectedSrcNetwork,
    selectedDstNetwork,
    walletAddress,
    srcAmount,
    addressesByChains,
}) {
    const SKIP_SERVICES = ['swap-skip', 'bridge-skip'];

    const makeRequest = async (params) => {
        try {
            if (SKIP_SERVICES.includes(selectedService.value.id) || moduleType === 'bridge') {
                return await estimateBridge(params);
            }

            return await estimateSwap(params);
        } catch (error) {
            console.error('estimate error', error);
            return { error: error.message };
        }
    };

    const getParams = () => {
        const baseParams = {
            url: selectedService.value.url,
            fromTokenAddress: selectedSrcToken.value?.address,
            toTokenAddress: selectedDstToken.value?.address,
            amount: srcAmount.value,
        };

        const skipParams = {
            fromNet: selectedSrcNetwork.value.net,
            toNet: moduleType === 'swap' ? selectedSrcNetwork.value.net : selectedDstNetwork.value.net,
            ownerAddresses: JSON.stringify(addressesByChains.value),
        };

        if (SKIP_SERVICES.includes(selectedService.value.id)) {
            return {
                ...baseParams,
                ...skipParams,
            };
        }

        if (moduleType === 'bridge') {
            return {
                ...baseParams,
                fromNet: selectedSrcNetwork.value.net,
                toNet: selectedDstNetwork.value.net,
                ownerAddress: walletAddress.value,
            };
        }

        return {
            ...baseParams,
            net: selectedSrcNetwork.value.net,
            ownerAddress: walletAddress.value,
        };
    };

    return {
        getParams,
        makeRequest,
    };
}
