import { h } from 'vue';
import { DoubleRightOutlined } from '@ant-design/icons-vue';

import useNotification from '@/compositions/useNotification';

import { delay } from '@/shared/utils/helpers';

export const isCorrectChain = async (selectedNetwork, currentChainInfo, setChain) => {
    let btnTitle = 'tokenOperations.confirm';

    const { showNotification, closeNotification } = useNotification();

    if (currentChainInfo.value.net === selectedNetwork.value.net) {
        return {
            isChanged: true,
            btnTitle,
        };
    }

    btnTitle = 'tokenOperations.switchNetwork';

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

        return {
            isChanged,
            btnTitle,
        };
    } catch (error) {
        closeNotification('switch-network');

        return {
            isChanged: false,
            btnTitle,
        };
    }
};

export const getOperationTitle = (selectedNet, currentNet, isApprove = false, isSwap = true) => {
    if (selectedNet !== currentNet) {
        return 'tokenOperations.switchNetwork';
    } else if (isApprove) {
        return 'tokenOperations.approve';
    } else if (!isSwap) {
        return 'tokenOperations.confirm';
    }

    return 'tokenOperations.swap';
};
