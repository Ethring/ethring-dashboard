import { isNaN, isEmpty, isEqual } from 'lodash';
import { computed } from 'vue';
import { useStore } from 'vuex';
import { AddressByChainHash } from '../models/types/Address';

const useInputValidation = () => {
    const store = useStore();

    // ===========================================================================================
    // * Fields
    // ===========================================================================================
    const selectedSrcNetwork = computed(() => store.getters['tokenOps/srcNetwork']);
    const selectedDstNetwork = computed(() => store.getters['tokenOps/dstNetwork']);
    const selectedSrcToken = computed(() => store.getters['tokenOps/srcToken']);
    const selectedDstToken = computed(() => store.getters['tokenOps/dstToken']);
    const srcAmount = computed(() => store.getters['tokenOps/srcAmount']);
    const dstAmount = computed(() => store.getters['tokenOps/dstAmount']);
    const receiverAddress = computed(() => store.getters['tokenOps/receiverAddress']);

    const serviceType = computed(() => store.getters['bridgeDexAPI/getSelectedServiceType']);
    const quoteRoutes = computed(() => store.getters['bridgeDexAPI/getQuoteRouteList'](serviceType.value));
    const selectedRoute = computed(() => store.getters['bridgeDexAPI/getSelectedRoute'](serviceType.value));

    // ===========================================================================================
    // * Validation
    // ===========================================================================================

    // ? Check if the source amount is set
    const isSrcAmountSet = computed(() => {
        if (!srcAmount.value) return false;

        if (srcAmount.value && srcAmount.value < 0) return false;

        return srcAmount.value && srcAmount.value > 0 && !isNaN(srcAmount.value) && !isEmpty(srcAmount.value);
    });

    // ? Check if the destination amount is set
    const isDstAmountSet = computed(() => {
        return dstAmount.value && dstAmount.value > 0 && !isNaN(dstAmount.value) && !isEmpty(dstAmount.value);
    });

    // ? Check if src token is set
    const isSrcTokenSet = computed(() => {
        return !isEmpty(selectedSrcToken.value) && !isEmpty(selectedSrcToken.value?.id);
    });

    // ? Check if src token address is set
    const isSrcTokenAddressSet = computed(() => {
        return !isEmpty(selectedSrcToken.value?.address);
    });

    // ? Check if dst token is set
    const isDstTokenSet = computed(() => {
        return !isEmpty(selectedDstToken.value) || !isEmpty(selectedDstToken.value?.id);
    });

    // ? Check if dst token address is set
    const isDstTokenAddressSet = computed(() => {
        return !isEmpty(selectedDstToken.value?.address);
    });

    // ? Check if Source Network is set
    const isSrcNetworkSet = computed(() => {
        return !isEmpty(selectedSrcNetwork.value) || !isEmpty(selectedSrcNetwork.value?.net);
    });

    // ? Check if Destination Network is set
    const isDstNetworkSet = computed(() => {
        return !isEmpty(selectedDstNetwork.value) || !isEmpty(selectedDstNetwork.value?.net);
    });

    // ? Check if the selected source token chain is correct
    const isSrcTokenChainCorrect = computed(() => {
        return isSrcTokenSet.value && isSrcNetworkSet.value && isEqual(selectedSrcToken.value?.chain, selectedSrcNetwork.value?.net);
    });

    // ? Check if the selected destination token chain is correct
    const isDstTokenChainCorrect = computed(() => {
        return isDstTokenSet.value && isDstNetworkSet.value && isEqual(selectedDstToken.value?.chain, selectedDstNetwork.value?.net);
    });

    const isDstTokenChainCorrectSwap = computed(() => {
        return isDstTokenSet.value && isSrcNetworkSet.value && isEqual(selectedDstToken.value?.chain, selectedSrcNetwork.value?.net);
    });

    // ? Check if the receiver address is set
    const isReceiverAddressSet = computed(() => {
        return !isEmpty(receiverAddress.value);
    });

    // ? Check if the selected source and destination tokens are the same
    const isSameToken = computed(() => {
        return isSrcTokenSet.value && isDstTokenSet.value && isEqual(selectedSrcToken.value?.id, selectedDstToken.value?.id);
    });

    // ? Check if the selected source and destination networks are the same
    const isSameNetwork = computed(() => {
        return isSrcNetworkSet.value && isDstNetworkSet.value && isEqual(selectedSrcNetwork.value?.net, selectedDstNetwork.value?.net);
    });

    // ? Check if the selected source and destination tokens are the same
    const isSameTokenSameNet = computed(() => {
        return isSameNetwork.value && isSameToken.value;
    });

    // ? Check if the quote route is set
    const isQuoteRouteSet = computed(() => {
        if (!quoteRoutes.value?.length) return false;
        return !isEmpty(quoteRoutes.value);
    });

    // ? Check if the quote route is selected
    const isQuoteRouteSelected = computed(() => {
        return !isEmpty(selectedRoute.value);
    });

    // ? Check if the quote route is correct
    const isQuoteRouteCorrect = computed(() => {
        return isQuoteRouteSet.value && isQuoteRouteSelected.value;
    });

    // ? Check if the source addresses are empty
    const isSrcAddressesEmpty = computed(() => {
        const { ecosystem: srcEcosystem } = selectedSrcNetwork.value || {};

        const srcAddressByChain = store.getters['adapters/getAddressesByEcosystem'](srcEcosystem) as AddressByChainHash;

        return !isEmpty(srcEcosystem) && isEmpty(srcAddressByChain);
    });

    // ? Check if the destination addresses are empty
    const isDstAddressesEmpty = computed(() => {
        const { ecosystem: dstEcosystem } = selectedDstNetwork.value || {};

        const dstAddressByChain = store.getters['adapters/getAddressesByEcosystem'](dstEcosystem) as AddressByChainHash;

        return !isEmpty(dstEcosystem) && isEmpty(dstAddressByChain);
    });

    return {
        isSrcAmountSet,
        isDstAmountSet,

        isSrcTokenChainCorrect,
        isDstTokenChainCorrect,
        isDstTokenChainCorrectSwap,
        isSrcAddressesEmpty,
        isDstAddressesEmpty,

        isReceiverAddressSet,

        isSrcNetworkSet,
        isDstNetworkSet,

        isSrcTokenSet,
        isSrcTokenAddressSet,

        isDstTokenSet,
        isDstTokenAddressSet,

        isSameToken,
        isSameNetwork,
        isSameTokenSameNet,

        isQuoteRouteSet,
        isQuoteRouteSelected,
        isQuoteRouteCorrect,
    };
};

export default useInputValidation;
