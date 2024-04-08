import _ from 'lodash';
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
        return srcAmount.value && srcAmount.value > 0 && !_.isNaN(srcAmount.value) && !_.isEmpty(srcAmount.value);
    });

    // ? Check if the destination amount is set
    const isDstAmountSet = computed(() => {
        return dstAmount.value && dstAmount.value > 0 && !_.isNaN(dstAmount.value) && !_.isEmpty(dstAmount.value);
    });

    // ? Check if src token is set
    const isSrcTokenSet = computed(() => {
        return !_.isEmpty(selectedSrcToken.value) && !_.isEmpty(selectedSrcToken.value?.id);
    });

    // ? Check if src token address is set
    const isSrcTokenAddressSet = computed(() => {
        return !_.isEmpty(selectedSrcToken.value?.address);
    });

    // ? Check if dst token is set
    const isDstTokenSet = computed(() => {
        return !_.isEmpty(selectedDstToken.value) || !_.isEmpty(selectedDstToken.value?.id);
    });

    // ? Check if dst token address is set
    const isDstTokenAddressSet = computed(() => {
        return !_.isEmpty(selectedDstToken.value?.address);
    });

    // ? Check if Source Network is set
    const isSrcNetworkSet = computed(() => {
        return !_.isEmpty(selectedSrcNetwork.value) || !_.isEmpty(selectedSrcNetwork.value?.net);
    });

    // ? Check if Destination Network is set
    const isDstNetworkSet = computed(() => {
        return !_.isEmpty(selectedDstNetwork.value) || !_.isEmpty(selectedDstNetwork.value?.net);
    });

    // ? Check if the selected source token chain is correct
    const isSrcTokenChainCorrect = computed(() => {
        return isSrcTokenSet.value && isSrcNetworkSet.value && _.isEqual(selectedSrcToken.value?.chain, selectedSrcNetwork.value?.net);
    });

    // ? Check if the selected destination token chain is correct
    const isDstTokenChainCorrect = computed(() => {
        return isDstTokenSet.value && isDstNetworkSet.value && _.isEqual(selectedDstToken.value?.chain, selectedDstNetwork.value?.net);
    });

    const isDstTokenChainCorrectSwap = computed(() => {
        return isDstTokenSet.value && isSrcNetworkSet.value && _.isEqual(selectedDstToken.value?.chain, selectedSrcNetwork.value?.net);
    });

    // ? Check if the receiver address is set
    const isReceiverAddressSet = computed(() => {
        return !_.isEmpty(receiverAddress.value);
    });

    // ? Check if the selected source and destination tokens are the same
    const isSameToken = computed(() => {
        return isSrcTokenSet.value && isDstTokenSet.value && _.isEqual(selectedSrcToken.value?.id, selectedDstToken.value?.id);
    });

    // ? Check if the selected source and destination networks are the same
    const isSameNetwork = computed(() => {
        return isSrcNetworkSet.value && isDstNetworkSet.value && _.isEqual(selectedSrcNetwork.value?.net, selectedDstNetwork.value?.net);
    });

    // ? Check if the selected source and destination tokens are the same
    const isSameTokenSameNet = computed(() => {
        return isSameNetwork.value && isSameToken.value;
    });

    // ? Check if the quote route is set
    const isQuoteRouteSet = computed(() => {
        if (!quoteRoutes.value?.length) return false;
        return !_.isEmpty(quoteRoutes.value);
    });

    // ? Check if the quote route is selected
    const isQuoteRouteSelected = computed(() => {
        return !_.isEmpty(selectedRoute.value);
    });

    // ? Check if the quote route is correct
    const isQuoteRouteCorrect = computed(() => {
        return isQuoteRouteSet.value && isQuoteRouteSelected.value;
    });

    // ? Check if the source addresses are empty
    const isSrcAddressesEmpty = computed(() => {
        const { ecosystem: srcEcosystem } = selectedSrcNetwork.value || {};

        const srcAddressByChain = store.getters['adapters/getAddressesByEcosystem'](srcEcosystem) as AddressByChainHash;

        return !_.isEmpty(srcEcosystem) && _.isEmpty(srcAddressByChain);
    });

    // ? Check if the destination addresses are empty
    const isDstAddressesEmpty = computed(() => {
        const { ecosystem: dstEcosystem } = selectedDstNetwork.value || {};

        const dstAddressByChain = store.getters['adapters/getAddressesByEcosystem'](dstEcosystem) as AddressByChainHash;

        return !_.isEmpty(dstEcosystem) && _.isEmpty(dstAddressByChain);
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
