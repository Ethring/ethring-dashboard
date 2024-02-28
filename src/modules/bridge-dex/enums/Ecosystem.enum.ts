export enum Ecosystem {
    evm = 'evm',
    cosmos = 'cosmos',
}

export type Ecosystems = keyof typeof Ecosystem;
