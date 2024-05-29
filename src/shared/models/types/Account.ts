import { IAddressByNetwork } from '@/core/wallet-adapter/models/ecosystem-adapter';
import { Ecosystems } from '@/shared/models/enums/ecosystems.enum';

export interface IConnectedWallet {
    id: string;
    account: string;
    address: string;
    chain?: number | string; // Main chain id used to connect to the wallet
    ecosystem: Ecosystems;
    walletName: string;
    walletModule: string;

    // Additional properties
    icon: string;
    addresses: IAddressByNetwork;
}
