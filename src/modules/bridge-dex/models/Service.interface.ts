import { Ecosystems } from '@/modules/bridge-dex/enums/Ecosystem.enum';
import { ServiceTypes } from '@/modules/bridge-dex/enums/ServiceType.enum';

export interface IService {
    type: ServiceTypes;

    id: string;
    name: string;
    icon: string | null;

    // URL of the service
    url: string;

    // Ecosystems that the service supports
    ecosystems: Ecosystems[];

    // Contract address for the service (available only for EVM services)
    contractAddress: string | null;

    // timeout: boolean;
}
