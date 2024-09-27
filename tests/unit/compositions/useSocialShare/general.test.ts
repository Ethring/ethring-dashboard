import { describe, expect, it, vi } from 'vitest';
import { useSocialShare } from '../../../../src/compositions/useSocialShare';
import { SocialNetworks, accounts } from '../../../../src/compositions/useSocialShare/data';
import { IShareParams } from '../../../../src/shared/models/types/SocialShare';

const networks = Object.keys(SocialNetworks).map((key) => SocialNetworks[key]);

describe('useShareLink composable - getShareLink function', () => {
    const { getShareLink, getSocialAccount } = useSocialShare();

    networks.forEach((network) => {
        it(`-> should return a share link for social-network "${network}"`, () => {
            const testUrl = 'https://example.com';
            const testTitle = 'Test title';

            const shareLink = getShareLink(network, {
                url: testUrl,
                title: testTitle,
            });

            expect(shareLink).toContain(network);
            expect(shareLink).toContain(encodeURIComponent(testUrl));
            expect(shareLink).toContain(encodeURIComponent(testTitle));
        });
    });

    it('-> should return an empty string for an invalid network', () => {
        const shareParams: IShareParams = {
            network: 'invalidNetwork',
            url: 'https://test.com',
            title: 'Test Title',
            description: 'Test Description',
            quote: 'Test Quote',
            hashtags: 'test,example',
            account: 'testAccount',
            media: 'testMedia',
        };

        expect(getShareLink('invalidNetwork', shareParams)).toBe('');
    });

    networks.forEach((network) => {
        it(`-> should return social account for "${network}"`, () => {
            const socialAccount = getSocialAccount(network);

            expect(socialAccount).toBeDefined();
            expect(socialAccount).not.toEqual('');
            expect(socialAccount).not.toBeNull();
            expect(socialAccount).not.toBeUndefined();
            expect(socialAccount).toBe(accounts[network]);
        });
    });

    it(`-> should return empty social account for an invalid network`, () => {
        expect(getSocialAccount('invalidNetwork')).toEqual('');
    });
});
