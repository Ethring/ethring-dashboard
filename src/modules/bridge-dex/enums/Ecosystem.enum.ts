export enum Ecosystem {
    evm = 'evm',
    cosmos = 'cosmos',
    EVM = 'EVM',
    COSMOS = 'COSMOS',
}

export type Ecosystems = keyof typeof Ecosystem;
