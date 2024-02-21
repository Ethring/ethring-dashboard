import _ from 'lodash';
import Moment from 'moment';

import { ONE_DAY, ONE_HOUR } from '@/shared/constants/operations';

const ASSET_TYPES = {
    DEPOSIT: 'DEPOSITED',
    PENDING_REWARD: 'REWARD',
    DEPOSIT_COLLATERAL: 'DEPOSITED_COLLATERAL',
};

export const getFormattedName = (str) => {
    if (!str) {
        return str;
    }

    const formattedStr = ASSET_TYPES[str] || str;

    return formattedStr.charAt(0).toUpperCase() + formattedStr.replaceAll('_', ' ').toLowerCase().slice(1);
};

export const getFormattedDate = (timestamp) => {
    return Moment(+timestamp * 1000).format('DD.MM.YYYY  h:mm');
};

export function getTimeCountdown(timestamp) {
    const timeDifference = Moment(+timestamp * 1000).diff(Moment(), 'milliseconds');

    const days = Math.floor(timeDifference / ONE_DAY);

    if (days > 0) {
        return `${days} days`;
    }

    const hours = Math.floor((timeDifference % ONE_DAY) / ONE_HOUR);

    if (hours > 0) {
        return `${hours} hours`;
    }

    const minutes = Math.floor((timeDifference % ONE_HOUR) / (1000 * 60));

    if (minutes > 0) {
        return `${minutes} minutes`;
    }

    return 'is available';
}
