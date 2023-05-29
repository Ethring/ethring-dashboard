import defaultChains from './default-chains';
import { getNetworksConfig } from '../../../api/networks';

const chainsList = (async () => await getNetworksConfig())().data;

export default chainsList || defaultChains;
