# useSocialShare

A hook to get the share URL for different social media platforms.

## Supported Platforms

-   [x.com / twitter.com](https://x.com)
-   [hey.xyz](https://hey.xyz)
-   [warpcast.com](https://warpcast.com)

---

### To Add More Platforms

1. Add the platform to the `SocialNetworks` enum in `useSocialShare/data/index.ts`.

2. Add the platform template url to the `linkTemplates` object in `useSocialShare/data/index.ts`.

3. If account is exist for the platform, add the account to the `accounts` object in `useSocialShare/data/index.ts`.

4. Add the platform to the `Supported Platforms` section in the README.

---

## Usage

```tsx
import { useSocialShare } from 'path/to/useSocialShare';

const Example = () => {
    const { getShareLink } = useSocialShare();

    const shareUrl = getShareLink('hey', {
        title: 'Hello World',
        url: 'https://example.com',
    });

    return {
        shareUrl,
    };
};
```
