import useWeb3Onboard from '@/compositions/useWeb3Onboard';

export function validateAddress(address) {
    try {
        const { currentChainInfo } = useWeb3Onboard();

        const reg = new RegExp(currentChainInfo.value.address_validating);
        return reg.test(address);

    } catch (e) {
        return false;
    }
}
