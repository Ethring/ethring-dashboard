export interface ISwapExactTokenForPTRequest {
    chainId: number;
    receiverAddr: string;
    marketAddr: string;
    tokenInAddr: string;
    amountTokenIn: bigint;
    slippage: number;
    syTokenInAddr?: string;
}

export interface ISwapExactTokenForPTResponse {
    transaction: {
        data: string;
        to: string;
    };
    methodName: string;
    contractCallParams: {
        '0': string;
        '1': string;
        '2': string;
        '3': {
            guessMin: string;
            guessMax: string;
            guessOffchain: string;
            maxIteration: string;
            eps: string;
        };
        '4': {
            tokenIn: '0xa68Ebfa934a50Fbde16d58470C7c9319cfc352aB';
            netTokenIn: string;
            tokenMintSy: '0xe8aFAE5AAe7Bf6D9C98187FAdE254bB2354FBcD1';
            pendleSwap: '0xe1f99FAaB926c8b961fBDe925b6C340BF8859839';
            swapData: {
                swapType: 0;
                extRouter: '0x169F4098FDf3EBA88C96e9A1abc2B6fe2E8BFFED';
                extCalldata: string;
                needScale: true;
            };
        };
        '5': {
            limitRouter: '0xBBfe872F7849f652db0215d0e3D0Eca4d5b65545';
            epsSkipMarket: string;
            normalFills: [
                {
                    order: {
                        salt: string;
                        expiry: string;
                        nonce: string;
                        orderType: string;
                        token: '0x6D07b2CB39bB5601E0912d33eBf8DDC0AaF66bFc';
                        YT: '0x2731eaDC8a7b063dFCADe53ecEBdB605C1F1dBef';
                        maker: '0xBF1bEe2c0125E43fc7e03BAf3B3AE89Bf6aAD20d';
                        receiver: '0xbcE48eb015eF1FAB908F6defC77EfD720f659129';
                        makingAmount: string;
                        lnImpliedRate: string;
                        failSafeRate: string;
                        permit: string;
                    };
                    signature: string;
                    makingAmount: string;
                },
            ];
            flashFills: [
                {
                    order: {
                        salt: string;
                        expiry: string;
                        nonce: string;
                        orderType: string;
                        token: '0xCFdb368Aa77c8Ef3FF0a6BcCc36f8aeB3BB18Aeb';
                        YT: '0x3d191AB99cD9368F8Cc2e1b66DbBE2Fd02f36A9a';
                        maker: '0xBF89bcb9f9D0A5882ae03bca4eBac5Faf1Bdd76B';
                        receiver: '0x339EA7D9c7420aDcE5C5AFf77aDDb8A82f33C2bc';
                        makingAmount: string;
                        lnImpliedRate: string;
                        failSafeRate: string;
                        permit: string;
                    };
                    signature: string;
                    makingAmount: string;
                },
            ];
            optData: string;
        };
        '6': {
            gasLimit: string;
            gasPrice: string;
            maxFeePerGas: string;
            maxPriorityFeePerGas: string;
            nonce: string;
            type: 0;
            accessList: string;
            customData: {
                additionalProp1: string;
                additionalProp2: string;
                additionalProp3: string;
            };
            ccipReadEnabled: true;
            value: string;
        };
        length: 0;
    };
    contractCallParamsName: [string, string, string, string, string, string, string];
    data: {
        amountPtOut: string;
        amountSyFeeFromMarket: string;
        amountSyFeeFromLimit: string;
        priceImpact: number;
    };
}
