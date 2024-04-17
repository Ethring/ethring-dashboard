import { AminoTypes } from '@cosmjs/stargate';
import { Registry } from '@cosmjs/proto-signing';

// import {
//     // Cosmos
//     cosmosAminoConverters,
//     cosmosProtoRegistry,
//     // CosmWasm
//     cosmwasmAminoConverters,
//     cosmwasmProtoRegistry,
//     // IBC
//     ibcProtoRegistry,
//     ibcAminoConverters,
//     // Publicawesome
//     publicawesomeAminoConverters,
//     publicawesomeProtoRegistry,
// } from 'stargazejs';

import {
    // Cosmos
    cosmosAminoConverters,
    cosmosProtoRegistry,
    // CosmWasm
    cosmwasmAminoConverters,
    cosmwasmProtoRegistry,
    // IBC
    ibcProtoRegistry,
    ibcAminoConverters,
} from 'injectivejs';

// import { injectiveAminoConverters, injectiveProtoRegistry } from 'injectivejs';

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
