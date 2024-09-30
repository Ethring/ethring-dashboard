import { describe, expect, it, vi } from 'vitest';

import { useSocialShare } from '../../../../src/compositions/useSocialShare';

import { IShareParams } from '../../../../src/shared/models/types/SocialShare';

import { linkTemplates, accounts, SocialNetworks } from '../../../../src/compositions/useSocialShare/data';

const list = Object.keys(SocialNetworks).map((key) => SocialNetworks[key]);

describe('useSocialShare composable - utils', () => {
    const { processLinkTemplate, getDefaultParams, validateSocialNetwork, normalizeParams } = useSocialShare();

    const getParams = (params: Partial<IShareParams>): Required<IShareParams> => {
        return Object.assign(getDefaultParams(), params);
    };

    describe('processLinkTemplate', () => {
        const template = 'test?u=@u&t=@t&d=@d&q=@q&h=@h&m=@m';

        it('-> replace url param', () => {
            const result = processLinkTemplate(template, getParams({ url: 'test' }));
            expect(result).toContain('test?u=test&t=&d=&q=&h=&m=');
        });

        it('-> replace title param', () => {
            const result = processLinkTemplate(template, getParams({ title: 'test' }));
            expect(result).toContain('test?u=&t=test&d=&q=&h=&m=');
        });

        it('-> replace description param', () => {
            const result = processLinkTemplate(template, getParams({ description: 'test' }));
            expect(result).toContain('test?u=&t=&d=test&q=&h=&m=');
        });

        it('-> replace quote param', () => {
            const result = processLinkTemplate(template, getParams({ quote: 'test' }));
            expect(result).toContain('test?u=&t=&d=&q=test&h=&m=');
        });

        it('-> replace hashtags param', () => {
            const result = processLinkTemplate(template, getParams({ hashtags: 'test' }));
            expect(result).toContain('test?u=&t=&d=&q=&h=test&m=');
        });

        it('-> replace media param', () => {
            const result = processLinkTemplate(template, getParams({ media: 'test' }));
            expect(result).toContain('test?u=&t=&d=&q=&h=&m=test');
        });

        it('-> replace account param', () => {
            const result = processLinkTemplate('test?u=@u&t=@t&d=@d&q=@q&h=@h&m=@m&v=@tu', getParams({ account: 'test' }));
            expect(result).toContain('test?u=&t=&d=&q=&h=&m=&v=test');
        });

        it('-> should replace placeholders in the link template with actual normalized values', () => {
            const linkTemplate = 'https://example.com/@u/@t/@d/@q/@h/@m/@tu';
            const linkParts = {
                network: '',
                url: 'https://test.com',
                title: 'Test Title',
                description: 'Test Description',
                quote: 'Test Quote',
                hashtags: 'test,example',
                account: 'testAccount',
                media: 'testMedia',
            };

            const normalizedParams = normalizeParams(linkParts);
            const result = processLinkTemplate(linkTemplate, normalizedParams);

            expect(result).toBe(
                'https://example.com/https%3A%2F%2Ftest.com/Test%20Title/Test%20Description/Test%20Quote/test%2Cexample/testMedia/testAccount',
            );
        });

        it('-> should replace placeholders in the link template with actual values', () => {
            const linkTemplate = 'https://example.com/@u/@t/@d/@q/@h/@m/@tu';
            const linkParts = {
                network: '',
                url: 'https://test.com',
                title: 'Test Title',
                description: 'Test Description',
                quote: 'Test Quote',
                hashtags: 'test,example',
                account: 'testAccount',
                media: 'testMedia',
            };

            const result = processLinkTemplate(linkTemplate, linkParts);

            expect(result).toBe(
                'https://example.com/https://test.com/Test Title/Test Description/Test Quote/test,example/testMedia/testAccount',
            );
        });
    });

    describe('validateSocialNetwork util', () => {
        list.forEach((network) => {
            it(`-> should return true for valid network "${network}"`, () => {
                expect(validateSocialNetwork(network)).toBe(true);
            });
        });

        it('should return false for an invalid social network', () => {
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            expect(validateSocialNetwork('invalidNetwork')).toBe(false);
            expect(consoleErrorSpy).toHaveBeenCalledWith('Social network "invalidNetwork" is not supported');
            consoleErrorSpy.mockRestore();
        });
    });

    describe('getDefaultParams', () => {
        it('-> should return default params', () => {
            expect(getDefaultParams()).toEqual({
                network: '',
                url: '',
                title: '',
                description: '',
                quote: '',
                hashtags: '',
                account: '',
                media: '',
            });
        });
    });

    describe('normalizeParams', () => {
        it('-> should return normalized params', () => {
            const params = getParams({ url: 'test' });

            expect(params).toEqual({
                network: '',
                url: 'test',
                title: '',
                description: '',
                quote: '',
                hashtags: '',
                account: '',
                media: '',
            });
        });

        it('should normalize share parameters and encode them', () => {
            const shareParams: IShareParams = {
                network: 'twitter',
                url: 'https://test.com',
                title: 'Test Title',
                description: 'Test Description',
                quote: 'Test Quote',
                hashtags: 'test,example',
                account: 'testAccount',
                media: 'testMedia',
            };
            const normalizedParams = normalizeParams(shareParams);

            expect(normalizedParams).toEqual({
                network: 'twitter',
                url: 'https%3A%2F%2Ftest.com',
                title: 'Test%20Title',
                description: 'Test%20Description',
                quote: 'Test%20Quote',
                hashtags: 'test%2Cexample',
                account: 'testAccount',
                media: 'testMedia',
            });
        });
    });
});
