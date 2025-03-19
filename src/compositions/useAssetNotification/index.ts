import { computed, ref, onMounted, watch, h } from 'vue';

import { orderBy } from 'lodash';

import { notification, Progress } from 'ant-design-vue';
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons-vue';
import ShoppingCart from '@/assets/icons/dashboard/shopping-cart.svg';

export function useAssetNotification() {
    const showAddToCardNotification = () => {
        notification.open({
            class: 'asset-notification asset-notification--success',
            message: 'Asset successfully added to bag',
            duration: 1,
            placement: 'bottomRight',
            closeIcon: () => h('span'),
            icon: h(ShoppingCart),
        });
    };

    const showRemoveFromCardNotification = () => {
        notification.open({
            class: 'asset-notification asset-notification--remove',
            message: 'Asset successfully removed from bag',
            duration: 1,
            placement: 'bottomRight',
            closeIcon: () => h('span'),
            icon: h(ShoppingCart),
        });
    };

    return {
        showAddToCardNotification,
        showRemoveFromCardNotification,
    };
}
