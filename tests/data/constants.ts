import path from 'path';
import { getTestVar, TEST_CONST } from '../envHelper';

export const EVM_NETWORKS = [
    'eth',
    'bsc',
    'arbitrum',
    'linea',
    'base',
    'mantle',
    // 'polygon',
    // 'avalanche',
    // 'optimism',
    // 'fantom',
    // 'zksync',
    // 'blast',
    // 'gnosis',
    // 'manta',
    // 'mode',
    // 'celo',
    // 'zora',
    // 'scroll',
    // 'berachain',
];

export const COSMOS_WALLETS_BY_PROTOCOL_SEED = {
    akash: 'akash1e9dvrk7n69hsupdnf6q5d0h6k6e33lnjdppyzc',
    axelar: 'axelar1e9dvrk7n69hsupdnf6q5d0h6k6e33lnjy56tsr',
    celestia: 'celestia1e9dvrk7n69hsupdnf6q5d0h6k6e33lnj3sanp0',
    cosmoshub: 'cosmos1e9dvrk7n69hsupdnf6q5d0h6k6e33lnjq6vrmz',
    dydx: 'dydx1e9dvrk7n69hsupdnf6q5d0h6k6e33lnjfrz8m4',
    fetchhub: 'fetch1e9dvrk7n69hsupdnf6q5d0h6k6e33lnjn898e4',
    kujira: 'kujira1e9dvrk7n69hsupdnf6q5d0h6k6e33lnj3jwmkg',
    neutron: 'neutron1e9dvrk7n69hsupdnf6q5d0h6k6e33lnjy99pp9',
    osmosis: 'osmo1e9dvrk7n69hsupdnf6q5d0h6k6e33lnjgplnds',
    saga: 'saga1e9dvrk7n69hsupdnf6q5d0h6k6e33lnj7f43uy',
    sei: 'sei1e9dvrk7n69hsupdnf6q5d0h6k6e33lnjdka4ar',
    stargaze: 'stars1e9dvrk7n69hsupdnf6q5d0h6k6e33lnj5xm7sn',
    stride: 'stride1e9dvrk7n69hsupdnf6q5d0h6k6e33lnjr3vl0w',
    bandchain: 'band178gru9ge2pykdkld74zalsfk56v7zw5ldvwckk',
    cryptoorgchain: 'cro14qj2uzgc2t8n0gy7v683krd26k25hdnsqzmfwy',
    dymension: 'dym16g4nw4a4kuqs4gwy9yan3chq65lmuhhuuffrq8',
    injective: 'inj16g4nw4a4kuqs4gwy9yan3chq65lmuhhuyajph3',
    kava: 'kava1meet5azt3rl86fz2czvzdwt7n0erut3ytehjzu',
    secretnetwork: 'secret13l9qs8yxnejhzc4s6dly2mmaqmfnrha2f28k2f',
    terra2: 'terra1sjl4q093a0s6mq2082sgty3asmdjqd3ahj85yg',
    // assetmantle: 'mantle1e9dvrk7n69hsupdnf6q5d0h6k6e33lnj77hxyg',
    // bitcanna: 'bcna1e9dvrk7n69hsupdnf6q5d0h6k6e33lnj62uzns',
    // bostrom: 'bostrom1e9dvrk7n69hsupdnf6q5d0h6k6e33lnjrfcs99',
    // comdex: 'comdex1e9dvrk7n69hsupdnf6q5d0h6k6e33lnj84wpz4',
    // cudos: 'cudos1e9dvrk7n69hsupdnf6q5d0h6k6e33lnjpt9u9h',
    // decentr: 'decentr1e9dvrk7n69hsupdnf6q5d0h6k6e33lnjt52h62',
    // emoney: 'emoney1e9dvrk7n69hsupdnf6q5d0h6k6e33lnj0ekhvl',
    // gravitybridge: 'gravity1e9dvrk7n69hsupdnf6q5d0h6k6e33lnjy27m72',
    // impacthub: 'ixo1e9dvrk7n69hsupdnf6q5d0h6k6e33lnjl0j3l3',
    // irisnet: 'iaa1e9dvrk7n69hsupdnf6q5d0h6k6e33lnj4cvjen',
    // juno: 'juno1e9dvrk7n69hsupdnf6q5d0h6k6e33lnjkg0cu7',
    // kichain: 'ki1e9dvrk7n69hsupdnf6q5d0h6k6e33lnj3havlk',
    // kyve: 'kyve1e9dvrk7n69hsupdnf6q5d0h6k6e33lnjh5p4sx',
    // likecoin: 'like1e9dvrk7n69hsupdnf6q5d0h6k6e33lnjnxspce',
    // mars: 'mars1e9dvrk7n69hsupdnf6q5d0h6k6e33lnja846we',
    // migaloo: 'migaloo1e9dvrk7n69hsupdnf6q5d0h6k6e33lnjdw9ewv',
    // nyx: 'n1e9dvrk7n69hsupdnf6q5d0h6k6e33lnjj7mpy8',
    // omniflixhub: 'omniflix1e9dvrk7n69hsupdnf6q5d0h6k6e33lnjaya6vu',
    // onomy: 'onomy1e9dvrk7n69hsupdnf6q5d0h6k6e33lnj6mc428',
    // passage: 'pasg1e9dvrk7n69hsupdnf6q5d0h6k6e33lnjrz4eka',
    // persistence: 'persistence1e9dvrk7n69hsupdnf6q5d0h6k6e33lnjwk2s4x',
    // quasar: 'quasar1e9dvrk7n69hsupdnf6q5d0h6k6e33lnjwek7k8',
    // quicksilver: 'quick1e9dvrk7n69hsupdnf6q5d0h6k6e33lnjt7u3zs',
    // rebus: 'rebus1e9dvrk7n69hsupdnf6q5d0h6k6e33lnj3s0k05',
    // regen: 'regen1e9dvrk7n69hsupdnf6q5d0h6k6e33lnjlc8ldx',
    // rizon: 'rizon1e9dvrk7n69hsupdnf6q5d0h6k6e33lnjr8sjh6',
    // sentinel: 'sent1e9dvrk7n69hsupdnf6q5d0h6k6e33lnjmp66ld',
    // shentu: 'shentu1e9dvrk7n69hsupdnf6q5d0h6k6e33lnjgwg6fl',
    // sommelier: 'somm1e9dvrk7n69hsupdnf6q5d0h6k6e33lnjvxr02g',
    // source: 'source1e9dvrk7n69hsupdnf6q5d0h6k6e33lnjxf4atu',
    // stafihub: 'stafi1e9dvrk7n69hsupdnf6q5d0h6k6e33lnjm3uf06',
    // teritori: 'tori1e9dvrk7n69hsupdnf6q5d0h6k6e33lnjzwm2qj',
    // umee: 'umee1e9dvrk7n69hsupdnf6q5d0h6k6e33lnjjv3uls',
    // agoric: 'agoric1zqk7u5aan0a3gka9u3h6s8zmylc36ctjynkyf8',
    // bitsong: 'bitsong1dgvqemawd2atfusesu6e4ytfd7v3w2yhc4vzvq',
    // canto: 'canto16g4nw4a4kuqs4gwy9yan3chq65lmuhhuuzy43p',
    // coreum: 'core1xcqdv7mh77v5hehjrm00mmxuwfc79mzfjffdut',
    // evmos: 'evmos16g4nw4a4kuqs4gwy9yan3chq65lmuhhuv45tlp',
    // finschia: 'link1tenhyg3pr3zrhl7gjdpwh7mgunl2qcrqjjzft2',
    // lumnetwork: 'lum1e9dvrk7n69hsupdnf6q5d0h6k6e33lnj4s32wk',
    // panacea: 'panacea1rywppst5gn4gd8tx883aafznhd7t0m272sf868',
    // planq: 'plq16g4nw4a4kuqs4gwy9yan3chq65lmuhhu8v4er6',
    // provenance: 'pb1k944mznzjf33r74jlyqxr084v5zm56ewpjquqr',
    // xpla: 'xpla16g4nw4a4kuqs4gwy9yan3chq65lmuhhusnaew6',
};

export const COSMOS_WALLETS_BY_SEED_MOCK_TX = {
    akash: 'akash1aascfnuh7dpup8cmyph2l0wgee9d2lchqytgke',
    axelar: 'axelar1aascfnuh7dpup8cmyph2l0wgee9d2lchf3s8yz',
    celestia: 'celestia1aascfnuh7dpup8cmyph2l0wgee9d2lchu4hl4w',
    cosmoshub: 'cosmos1aascfnuh7dpup8cmyph2l0wgee9d2lchdlx00r',
    dydx: 'dydx1aascfnuh7dpup8cmyph2l0wgee9d2lchyxgt05',
    fetchhub: 'fetch1aascfnuh7dpup8cmyph2l0wgee9d2lch7z0td5',
    kujira: 'kujira1aascfnuh7dpup8cmyph2l0wgee9d2lchuhyhzf',
    neutron: 'neutron1aascfnuh7dpup8cmyph2l0wgee9d2lchfq0d4y',
    osmosis: 'osmo1aascfnuh7dpup8cmyph2l0wgee9d2lch9y4le3',
    saga: 'saga1aascfnuh7dpup8cmyph2l0wgee9d2lchnvlag9',
    sei: 'sei1aascfnuh7dpup8cmyph2l0wgee9d2lchqnhefz',
    stargaze: 'stars1aascfnuh7dpup8cmyph2l0wgee9d2lcher3jyj',
    stride: 'stride1aascfnuh7dpup8cmyph2l0wgee9d2lchw5xnm0',
    bandchain: 'band1qgu03xt8zrz6jq7rcjyup4eextzqnepkyh5rja',
    cryptoorgchain: 'cro1jf0pqz6j4z540lu0v2j2t42jwwzjzexu2tet7n',
    dymension: 'dym1gaw02t47wctyv79kw0kup5l0gd0v7erppvgfk8',
    injective: 'inj1gaw02t47wctyv79kw0kup5l0gd0v7erpecntp3',
    kava: 'kava1n9ygwkqacukc7jn0kjtaptsqljslk03fyvh97m',
    secretnetwork: 'secret1hpjsy9vurlsazwwqejznml9h388gfmemg3w2ea',
    terra2: 'terra1kl6pdx384mctqz04c866f7yrw3zwtz590343kx',
    // assetmantle: 'mantle1aascfnuh7dpup8cmyph2l0wgee9d2lchnma2sf',
    // bitcanna: 'bcna1aascfnuh7dpup8cmyph2l0wgee9d2lchh0kw83',
    // bostrom: 'bostrom1aascfnuh7dpup8cmyph2l0wgee9d2lchwvju3y',
    // comdex: 'comdex1aascfnuh7dpup8cmyph2l0wgee9d2lch2sydk5',
    // cudos: 'cudos1aascfnuh7dpup8cmyph2l0wgee9d2lchvw0s3k',
    // decentr: 'decentr1aascfnuh7dpup8cmyph2l0wgee9d2lchx3qmwt',
    // emoney: 'emoney1aascfnuh7dpup8cmyph2l0wgee9d2lchzuumc7',
    // gravitybridge: 'gravity1aascfnuh7dpup8cmyph2l0wgee9d2lchf05h2t',
    // impacthub: 'ixo1aascfnuh7dpup8cmyph2l0wgee9d2lchj2cats',
    // irisnet: 'iaa1aascfnuh7dpup8cmyph2l0wgee9d2lchcax7dj',
    // juno: 'juno1aascfnuh7dpup8cmyph2l0wgee9d2lchmd95gl',
    // kichain: 'ki1aascfnuh7dpup8cmyph2l0wgee9d2lchujhqth',
    // kyve: 'kyve1aascfnuh7dpup8cmyph2l0wgee9d2lch63tey8',
    // likecoin: 'like1aascfnuh7dpup8cmyph2l0wgee9d2lch7r6dvc',
    // mars: 'mars1aascfnuh7dpup8cmyph2l0wgee9d2lchszlk6c',
    // migaloo: 'migaloo1aascfnuh7dpup8cmyph2l0wgee9d2lchqt046d',
    // nyx: 'n1aascfnuh7dpup8cmyph2l0wgee9d2lchlm3dsx',
    // omniflixhub: 'omniflix1aascfnuh7dpup8cmyph2l0wgee9d2lchsphkca',
    // onomy: 'onomy1aascfnuh7dpup8cmyph2l0wgee9d2lchh7je7x',
    // passage: 'pasg1aascfnuh7dpup8cmyph2l0wgee9d2lchw8l4zu',
    // persistence: 'persistence1aascfnuh7dpup8cmyph2l0wgee9d2lchrnqup8',
    // quasar: 'quasar1aascfnuh7dpup8cmyph2l0wgee9d2lchruujzx',
    // quicksilver: 'quick1aascfnuh7dpup8cmyph2l0wgee9d2lchxmkak3',
    // rebus: 'rebus1aascfnuh7dpup8cmyph2l0wgee9d2lchu496m4',
    // regen: 'regen1aascfnuh7dpup8cmyph2l0wgee9d2lchjadne8',
    // rizon: 'rizon1aascfnuh7dpup8cmyph2l0wgee9d2lchwz67rm',
    // sentinel: 'sent1aascfnuh7dpup8cmyph2l0wgee9d2lchkysktv',
    // shentu: 'shentu1aascfnuh7dpup8cmyph2l0wgee9d2lch9tzka7',
    // sommelier: 'somm1aascfnuh7dpup8cmyph2l0wgee9d2lchprfr7f',
    // source: 'source1aascfnuh7dpup8cmyph2l0wgee9d2lchtvl3la',
    // stafihub: 'stafi1aascfnuh7dpup8cmyph2l0wgee9d2lchk5k9mm',
    // teritori: 'tori1aascfnuh7dpup8cmyph2l0wgee9d2lch0t3x5n',
    // umee: 'umee1aascfnuh7dpup8cmyph2l0wgee9d2lchlfmst3',
    // agoric: 'agoric1a8uawlgwuvje0jajywpxx0amfgrmhxs87kggvw',
    // bitsong: 'bitsong1qcgu05wj2gzeg3kxgrppdt6x0rjzzvr9ng5sh5',
    // canto: 'canto1gaw02t47wctyv79kw0kup5l0gd0v7erpp89l8p',
    // coreum: 'core1a4s6r83xdyxuxgcdud8tf6zly0g3jt335n0zux',
    // evmos: 'evmos1gaw02t47wctyv79kw0kup5l0gd0v7erp3s4pfp',
    // finschia: 'link152dts2zdl68sv8sn7w6kcgsmxz74xg8thj6hxu',
    // lumnetwork: 'lum1aascfnuh7dpup8cmyph2l0wgee9d2lchc4mx6h',
    // panacea: 'panacea150x9u8p2j0q5wu8z5fxa0uda3cq2jrf6lcyuea',
    // planq: 'plq1gaw02t47wctyv79kw0kup5l0gd0v7erp6f5n46',
    // provenance: 'pb1znhsg5nacwkkmfmjuv0tjnctzkkm9l42e8p4yq',
    // xpla: 'xpla1gaw02t47wctyv79kw0kup5l0gd0v7erpdkunc6',
};

export const COSMOS_WALLETS_BY_EMPTY_WALLET = {
    akash: 'akash1asutnqnxzu8pmzsfet4dla47nwpyuquj975fft',
    axelar: 'axelar1asutnqnxzu8pmzsfet4dla47nwpyuqujvt0xms',
    celestia: 'celestia1asutnqnxzu8pmzsfet4dla47nwpyuquje0g72u',
    cosmoshub: 'cosmos1asutnqnxzu8pmzsfet4dla47nwpyuqujg9ews3',
    dydx: 'dydx1asutnqnxzu8pmzsfet4dla47nwpyuqujpuh2sx',
    fetchhub: 'fetch1asutnqnxzu8pmzsfet4dla47nwpyuqujmcs2jx',
    kujira: 'kujira1asutnqnxzu8pmzsfet4dla47nwpyuqujedmkam',
    neutron: 'neutron1asutnqnxzu8pmzsfet4dla47nwpyuqujv6sv2k',
    osmosis: 'osmo1asutnqnxzu8pmzsfet4dla47nwpyuqujq727xr',
    saga: 'saga1asutnqnxzu8pmzsfet4dla47nwpyuqujkkquhh',
    sei: 'sei1asutnqnxzu8pmzsfet4dla47nwpyuquj9fgcks',
    stargaze: 'stars1asutnqnxzu8pmzsfet4dla47nwpyuqujuewnmq',
    stride: 'stride1asutnqnxzu8pmzsfet4dla47nwpyuqujtwejya',
    bandchain: 'band15eyuj59fmc6nwdq0me857rn6k0kqkgenalhm7k',
    cryptoorgchain: 'cro1ls22grxhav4cl0jtanjwy6ahhucu47p7wja6s3',
    dymension: 'dym1ckux2tgss25ld9s0zq98x52vuym8pyc2v4aj3q',
    injective: 'inj1ckux2tgss25ld9s0zq98x52vuym8pyc25pxsxk',
    kava: 'kava1haavkjr8ftj7gtzf86ksgcp66wx3cjmcawjevs',
    secretnetwork: 'secret1h8vwfgwza3ufhdyjh686dqe9t7e3nxmtc4xhz7',
    terra2: 'terra1tguy55gz22u6qet4pv9jrfjpx79ycg4l5g6hcw',
    // assetmantle: 'mantle1asutnqnxzu8pmzsfet4dla47nwpyuqujkpzt0m',
    // bitcanna: 'bcna1asutnqnxzu8pmzsfet4dla47nwpyuqujj4f0cr',
    // bostrom: 'bostrom1asutnqnxzu8pmzsfet4dla47nwpyuqujtkdawk',
    // comdex: 'comdex1asutnqnxzu8pmzsfet4dla47nwpyuquj02mvfx',
    // cudos: 'cudos1asutnqnxzu8pmzsfet4dla47nwpyuqujf5s3wy',
    // decentr: 'decentr1asutnqnxzu8pmzsfet4dla47nwpyuqujrtl63e',
    // emoney: 'emoney1asutnqnxzu8pmzsfet4dla47nwpyuquj8xr68v',
    // gravitybridge: 'gravity1asutnqnxzu8pmzsfet4dla47nwpyuqujv4tk4e',
    // impacthub: 'ixo1asutnqnxzu8pmzsfet4dla47nwpyuqujhs8u5z',
    // irisnet: 'iaa1asutnqnxzu8pmzsfet4dla47nwpyuquja8eljq',
    // juno: 'juno1asutnqnxzu8pmzsfet4dla47nwpyuquj7h64hd',
    // kichain: 'ki1asutnqnxzu8pmzsfet4dla47nwpyuqujeggp59',
    // kyve: 'kyve1asutnqnxzu8pmzsfet4dla47nwpyuqujlt5cm4',
    // likecoin: 'like1asutnqnxzu8pmzsfet4dla47nwpyuqujme9vn2',
    // mars: 'mars1asutnqnxzu8pmzsfet4dla47nwpyuquj4cqh92',
    // migaloo: 'migaloo1asutnqnxzu8pmzsfet4dla47nwpyuquj93s59l',
    // nyx: 'n1asutnqnxzu8pmzsfet4dla47nwpyuquj6pwv05',
    // omniflixhub: 'omniflix1asutnqnxzu8pmzsfet4dla47nwpyuquj4mgh80',
    // onomy: 'onomy1asutnqnxzu8pmzsfet4dla47nwpyuqujjydcp5',
    // passage: 'pasg1asutnqnxzu8pmzsfet4dla47nwpyuqujtaq5aw',
    // persistence: 'persistence1asutnqnxzu8pmzsfet4dla47nwpyuqujxfla74',
    // quasar: 'quasar1asutnqnxzu8pmzsfet4dla47nwpyuqujxxrna5',
    // quicksilver: 'quick1asutnqnxzu8pmzsfet4dla47nwpyuqujrpfufr',
    // rebus: 'rebus1asutnqnxzu8pmzsfet4dla47nwpyuquje06my8',
    // regen: 'regen1asutnqnxzu8pmzsfet4dla47nwpyuqujh8jjx4',
    // rizon: 'rizon1asutnqnxzu8pmzsfet4dla47nwpyuqujtc9luf',
    // sentinel: 'sent1asutnqnxzu8pmzsfet4dla47nwpyuqujn70h57',
    // shentu: 'shentu1asutnqnxzu8pmzsfet4dla47nwpyuqujq3ahzv',
    // sommelier: 'somm1asutnqnxzu8pmzsfet4dla47nwpyuqujyekzpm',
    // source: 'source1asutnqnxzu8pmzsfet4dla47nwpyuqujwkqsq0',
    // stafihub: 'stafi1asutnqnxzu8pmzsfet4dla47nwpyuqujnwfyyf',
    // teritori: 'tori1asutnqnxzu8pmzsfet4dla47nwpyuquj23w8tp',
    // umee: 'umee1asutnqnxzu8pmzsfet4dla47nwpyuquj6ny35r',
    // agoric: 'agoric1qvskq42jhxrtwcr3kedr7fgw8exhd2stjscshc',
    // bitsong: 'bitsong16x7x8xutljx8t98k9shwm0c4qce88hthckrqfy',
    // canto: 'canto1ckux2tgss25ld9s0zq98x52vuym8pyc2v7syqx',
    // coreum: 'core1nlhnfznjlhytlcjcsm0xlmu976umspx23smy6f',
    // evmos: 'evmos1ckux2tgss25ld9s0zq98x52vuym8pyc2ufq6wx',
    // finschia: 'link1stf9fg2pmtcyjcrc09u8mymwd7hkgga7q9j6z2',
    // lumnetwork: 'lum1asutnqnxzu8pmzsfet4dla47nwpyuquja0y899',
    // panacea: 'panacea17rnt28wz9xyngp7x8mlhcrctcvg20k9q08vtm9',
    // planq: 'plq1ckux2tgss25ld9s0zq98x52vuym8pyc2hspgja',
    // provenance: 'pb10crk8xs0p9qvuswhj3qvnzldd94adqgctly85g',
    // xpla: 'xpla1ckux2tgss25ld9s0zq98x52vuym8pyc2q0fgla',
};

export const COSMOS_WALLET_BY_SHORTCUT = {
    akash: 'akash14urxph3lj0zpfks6psw5ynppwtcc6766mr4dru',
    axelar: 'axelar14urxph3lj0zpfks6psw5ynppwtcc6766jkwz38',
    celestia: 'celestia14urxph3lj0zpfks6psw5ynppwtcc67668jf6qt',
    cosmoshub: 'cosmos14urxph3lj0zpfks6psw5ynppwtcc6766kcc26x',
    dydx: 'dydx14urxph3lj0zpfks6psw5ynppwtcc6766lpkw63',
    fetchhub: 'fetch14urxph3lj0zpfks6psw5ynppwtcc6766993wc3',
    kujira: 'kujira14urxph3lj0zpfks6psw5ynppwtcc67668s6jhv',
    neutron: 'neutron14urxph3lj0zpfks6psw5ynppwtcc6766j83gqp',
    osmosis: 'osmo14urxph3lj0zpfks6psw5ynppwtcc67667rt6v5',
    saga: 'saga14urxph3lj0zpfks6psw5ynppwtcc6766gtpcaq',
    sei: 'sei14urxph3lj0zpfks6psw5ynppwtcc6766m5fuu8',
    stargaze: 'stars14urxph3lj0zpfks6psw5ynppwtcc6766zy0h3h',
    stride: 'stride14urxph3lj0zpfks6psw5ynppwtcc67664nckw2',
    bandchain: 'band1jxyz08xj8gjaazevr4tl6hvxllcetd5ezcetmy',
    cryptoorgchain: 'cro1t032qwezcdfz3zywp5jyw6tgwlh6jd9tdxw587',
    dymension: 'dym16qq4ypy9sqtprftcvajjehcwn7vpwwtk08vzcu',
    injective: 'inj16qq4ypy9sqtprftcvajjehcwn7vpwwtkhnhq02',
    kava: 'kava1kynzkk5psctdsts4clkwhglm9hjqkjxf4ywq4j',
    secretnetwork: 'secret1076ekn7rn7yrhsc6mu0jj99604pwlzgvze76vj',
    terra2: 'terra1r8qy45w9gwdchdhrepa8jacq3j8tpzvh7du40j',
    // assetmantle: 'mantle14urxph3lj0zpfks6psw5ynppwtcc6766gur09v',
    // bitcanna: 'bcna14urxph3lj0zpfks6psw5ynppwtcc6766vggtj5',
    // bostrom: 'bostrom14urxph3lj0zpfks6psw5ynppwtcc67664tveyp',
    // comdex: 'comdex14urxph3lj0zpfks6psw5ynppwtcc67663h6gr3',
    // cudos: 'cudos14urxph3lj0zpfks6psw5ynppwtcc6766hf34yn',
    // decentr: 'decentr14urxph3lj0zpfks6psw5ynppwtcc6766ak77mw',
    // emoney: 'emoney14urxph3lj0zpfks6psw5ynppwtcc6766emz7dm',
    // gravitybridge: 'gravity14urxph3lj0zpfks6psw5ynppwtcc6766jg2jlw',
    // impacthub: 'ixo14urxph3lj0zpfks6psw5ynppwtcc6766fdxc74',
    // irisnet: 'iaa14urxph3lj0zpfks6psw5ynppwtcc6766r6cmch',
    // juno: 'juno14urxph3lj0zpfks6psw5ynppwtcc6766q2m3a6',
    // kichain: 'ki14urxph3lj0zpfks6psw5ynppwtcc676684f97j',
    // kyve: 'kyve14urxph3lj0zpfks6psw5ynppwtcc6766pk4u3z',
    // likecoin: 'like14urxph3lj0zpfks6psw5ynppwtcc67669yygea',
    // mars: 'mars14urxph3lj0zpfks6psw5ynppwtcc6766t9pn0a',
    // migaloo: 'migaloo14urxph3lj0zpfks6psw5ynppwtcc6766mv3s0g',
    // nyx: 'n14urxph3lj0zpfks6psw5ynppwtcc6766yu0g9r',
    // omniflixhub: 'omniflix14urxph3lj0zpfks6psw5ynppwtcc6766txfndc',
    // onomy: 'onomy14urxph3lj0zpfks6psw5ynppwtcc6766vevutr',
    // passage: 'pasg14urxph3lj0zpfks6psw5ynppwtcc67664qpshe',
    // persistence: 'persistence14urxph3lj0zpfks6psw5ynppwtcc6766c57e5z',
    // quasar: 'quasar14urxph3lj0zpfks6psw5ynppwtcc6766cmzhhr',
    // quicksilver: 'quick14urxph3lj0zpfks6psw5ynppwtcc6766augcr5',
    // rebus: 'rebus14urxph3lj0zpfks6psw5ynppwtcc67668jmlws',
    // regen: 'regen14urxph3lj0zpfks6psw5ynppwtcc6766f6nkvz',
    // rizon: 'rizon14urxph3lj0zpfks6psw5ynppwtcc676649ymk7',
    // sentinel: 'sent14urxph3lj0zpfks6psw5ynppwtcc6766drwn7f',
    // shentu: 'shentu14urxph3lj0zpfks6psw5ynppwtcc67667vungm',
    // sommelier: 'somm14urxph3lj0zpfks6psw5ynppwtcc67666yhxtv',
    // source: 'source14urxph3lj0zpfks6psw5ynppwtcc6766stp52c',
    // stafihub: 'stafi14urxph3lj0zpfks6psw5ynppwtcc6766dngqw7',
    // teritori: 'tori14urxph3lj0zpfks6psw5ynppwtcc67665v0rpk',
    // umee: 'umee14urxph3lj0zpfks6psw5ynppwtcc6766yw9475',
    // agoric: 'agoric183r9y7cxyfj6d3pmunnh4usfcsu4tnh5rq2mt4',
    // bitsong: 'bitsong1f6swsenns675gmfk6xrhazyf7dxdkacj6s3m7g',
    // canto: 'canto16qq4ypy9sqtprftcvajjehcwn7vpwwtk0vp5f6',
    // coreum: 'core1jr4hy336v4kqvaxyahryxd8c09hr2xwd0pn3rw',
    // evmos: 'evmos16qq4ypy9sqtprftcvajjehcwn7vpwwtklm3286',
    // finschia: 'link1am276s06es3dqfva3u05g9lgt2h6htgvar07av',
    // lumnetwork: 'lum14urxph3lj0zpfks6psw5ynppwtcc6766rj9r0j',
    // panacea: 'panacea1h77h46jtmekahj7tejqtcaxagqktv4egd896wk',
    // planq: 'plq16qq4ypy9sqtprftcvajjehcwn7vpwwtk5zscmp',
    // provenance: 'pb1xuywkqnrf3t65kn6clqlwdwafwcqsanfv2xfww',
    // xpla: 'xpla16qq4ypy9sqtprftcvajjehcwn7vpwwtkracckp',
};

export const MetaMaskDirPath = path.resolve(
    process.cwd(),
    'tests',
    'extensions-data',
    `metamask-chrome-${getTestVar(TEST_CONST.MM_VERSION)}`,
);

export const KeplrDirPath = path.resolve(
    process.cwd(),
    'tests',
    'extensions-data',
    `keplr-extension-manifest-v2-v${getTestVar(TEST_CONST.KEPLR_VERSION)}`,
);

export enum DATA_QA_LOCATORS {
    SELECT_NETWORK = 'select-network',
    TOKEN_RECORD = 'token-record',
    SELECT_TOKEN = 'select-token',
    EVM_ECOSYSTEM_WALLET = 'EVM Ecosystem wallet',
    COSMOS_ECOSYSTEM_WALLET = 'Cosmos Ecosystem wallet',
    SIDEBAR_SEND = 'sidebar-item-send',
    // SIDEBAR_SWAP = 'sidebar-item-swap',
    // SIDEBAR_BRIDGE = 'sidebar-item-bridge',
    SIDEBAR_SUPER_SWAP = 'sidebar-item-superSwap',
    SIDEBAR_SHORTCUT = 'sidebar-item-shortcut',
    DASHBOARD = 'dashboard',
    CONTENT = 'content',
    RECORD_MODAL = 'select-record-modal',
    CONFIRM = 'confirm',
    ASSETS_PANEL = 'assets-panel',
    CUSTOM_INPUT = 'custom-input',
    CHECKBOX = 'checkbox',

    INPUT_ADDRESS = 'input-address',
    INPUT_AMOUNT = 'input-amount',

    ITEM = 'item',
    ROUTE_INFO = 'estimate-info',
    SLIPPAGE_ICON = 'slippage-icon',
    SLIPPAGE_CUSTOM = 'slippage-custom',
    SLIPPAGE_CUSTOM_INPUT = 'slippage-custom-input',

    RELOAD_ROUTE = 'reload-route',
}

export enum IGNORED_LOCATORS {
    HEADER = '//header',
    ASIDE = '//aside',
    SERVICE_ICON = 'div.service-icon',
    PROTOCOL_ICON_1 = 'div.token-icon[data-qa="AAV"]',
    PROTOCOL_ICON_2 = 'div.token-icon[data-qa="STA"]',
    TOKEN_ICON_1 = 'div.token-icon[data-qa="Wrapped Matic"]',
    TOKEN_ICON_2 = 'div.token-icon[data-qa="Wrapped Bitcoin"]',
    TOKEN_ICON_3 = 'div.token-icon[data-qa="Polygon"]',
    TOKEN_ICON_4 = 'div.token-icon[data-qa="Stader MaticX"]',
    TOKEN_ICON_5 = 'div.token-icon[data-qa="Stargate Finance"]',
    TOKEN_ICON_6 = 'div.token-icon[data-qa="ARB"]',
    TRANSACTION_PROGRESS = 'div.notification-progress-line',
    RELOAD_ROUTE = 'div[data-qa="reload-route"]',
}

export enum URL_MOCK_PATTERNS {
    MOCK_SWAP = '**/services/dex/getQuote**',
    MOCK_BRIDGE = '**/services/bridgedex/getQuote**',
    MOCK_REMOVE_LP = '**/srv-portal-fi-add-portal-fi/api/getQuoteRemoveLiquidity**',
}

export const MEMO_BY_KEPLR_TEST = '105371789';

export enum METAMASK_DEFAULT_URL_NODE {
    BSC = 'https://bsc.publicnode.com/',
    POLYGON = 'https://polygon-rpc.com/',
    ARBITRUM = 'https://arb1.arbitrum.io/rpc',
}

export enum METAMASK_FAKE_URL_NODE {
    POLYGON = 'https://evm-fake-node.3ahtim54r.ru/polygon',
    BSC = 'https://evm-fake-node.3ahtim54r.ru/bsc',
    ARBITRUM = 'https://evm-fake-node.3ahtim54r.ru/arbitrum',
}

export enum METAMASK_DEFAULT_NETWORK_NAME {
    POLYGON = 'Polygon Mainnet',
    BSC = 'BNB Chain',
    // ARBITRUM = '',
}
