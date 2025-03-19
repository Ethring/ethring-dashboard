import { computed, ref, onMounted, watch, h } from 'vue';

import { orderBy } from 'lodash';

import { notification, Progress } from 'ant-design-vue';
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons-vue';

export function useAssetNotification() {
    const showAddToCardNotification = () => {
        notification.open({
            class: 'asset-notification asset-notification--success',
            message: 'Asset successfully added to bag',
            duration: 1,
            placement: 'bottomRight',
            closeIcon: () => h('span'),
            icon: h(CheckCircleFilled),
        });
    };

    const showRemoveFromCardNotification = () => {
        notification.open({
            class: 'asset-notification asset-notification--remove',
            message: 'Asset successfully removed from bag',
            duration: 1,
            placement: 'bottomRight',
            closeIcon: () => h('span'),
            icon: h(CloseCircleFilled),
        });
    };

    return {
        showAddToCardNotification,
        showRemoveFromCardNotification,
    };
}
