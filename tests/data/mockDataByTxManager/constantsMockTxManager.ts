import { TEST_CONST, getTestVar } from '../../envHelper';

const mockAddressTo = getTestVar(TEST_CONST.RECIPIENT_ADDRESS);
const txHashFromProxyMock = '0xd9193bc27c644e2c0db7353daabe4b268b7ba10c707f80de166d55852884a368';

export { mockAddressTo, txHashFromProxyMock };
