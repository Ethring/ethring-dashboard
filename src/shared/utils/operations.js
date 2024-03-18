import { h } from 'vue';
import { DoubleRightOutlined } from '@ant-design/icons-vue';

import useNotification from '@/compositions/useNotification';

import { delay } from '@/shared/utils/helpers';

export const isCorrectChain = async (selectedNetwork, currentChainInfo, setChain) => {
    const { showNotification, closeNotification } = useNotification();

    if (currentChainInfo.value.ecosystem !== selectedNetwork.value.ecosystem) {
        showNotification({
            key: 'switch-ecosystem',
            type: 'error',
            title: `Different ecosystem`,
            duration: 3,
        });

        return false;
    }
    if (currentChainInfo.value.net === selectedNetwork.value.net) {
        return true;
    }

    showNotification({
        key: 'switch-network',
        type: 'info',
        title: `Switch network to ${selectedNetwork.value.name}`,
        duration: 0,
    });

    try {
        const isChanged = await setChain(selectedNetwork.value);

        await delay(1200);

        if (!isChanged) {
            showNotification({
                key: 'switch-network-error',
                type: 'error',
                title: `Failed to switch network to ${selectedNetwork.value.name}`,
                description: 'Please try again',
                duration: 2,
            });
        }

        closeNotification('switch-network');

        return Boolean(isChanged);
    } catch (error) {
        closeNotification('switch-network');

        return false;
    }
};
