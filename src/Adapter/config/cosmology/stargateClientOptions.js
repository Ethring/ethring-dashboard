import {
    cosmosAminoConverters,
    cosmosProtoRegistry,
    cosmwasmAminoConverters,
    cosmwasmProtoRegistry,
    ibcProtoRegistry,
    ibcAminoConverters,
} from 'osmojs';

// import { injectiveAminoConverters, injectiveProtoRegistry } from 'injectivejs';

import { AminoTypes } from '@cosmjs/stargate';
import { Registry } from '@cosmjs/proto-signing';

// Custom Registry for stargate

const AMINO_CONVERTERS = {
    // Amino converters for cosmos
    ...cosmosAminoConverters,
    ...cosmwasmAminoConverters,
    ...ibcAminoConverters,
};

const PROTO_REGISTRY = [
    // Protobuf registry for cosmos
    ...cosmosProtoRegistry,
    ...cosmwasmProtoRegistry,
    ...ibcProtoRegistry,
];

const aminoTypes = new AminoTypes(AMINO_CONVERTERS);
const registry = new Registry(PROTO_REGISTRY);

export { aminoTypes, registry };
