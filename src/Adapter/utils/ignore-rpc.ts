const IGNORE_DOMAINS = [
    'cosmos-spaces.cloud',
    'ecostake.com',
    'silknodes.io',
    'stakin-nodes.com',
    'lavenderfive.com',
    'enigma-validator.com',
    'stakeflow.io',
    'quickapi.com',
    'onivalidator.com',
    'keplr.app',
    'blockapsis.com',
    'pupmos.network',
    'dragonstake.io',
    'architectnodes.com',
    'staketab.org',
    'bh.rocks',
    'rockrpc.net',
    'easy2stake.com',
    'freshstaking.com',
    'icycro.org',
    'whispernode.com',
    'onfinality.io',
    'mms.team',
    'autostake.com',
    'nuxian-node.ch',
    'rpc.l0vd',
    'validatus.com',
    'stavr.tech',
    'goldenratiostaking.net',
    'chaintools.tech',
    'kleomedes.network',
    'validavia.me',
    'notional.ventures',
    'stakeandrelax.net',
    'validatrium.club',
    'w3coins.io',
    'bronbro.io',
];

const ignoreRegex = new RegExp(IGNORE_DOMAINS.join('|'), 'i');

// Ignore RPCs for a specific chain to avoid spamming the network
export const ignoreRPC = (rpc: string) => {
    if (rpc.includes('localhost')) return false;

    return ignoreRegex.test(rpc);
};
