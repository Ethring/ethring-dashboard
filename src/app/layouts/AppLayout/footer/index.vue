<template>
    <div class="footer-container">
        <div class="footer-block footer-block--right">
            <span class="footer-copyright">© Ethring 2025</span>

            <div class="footer-socials">
                <a href="https://mirror.xyz/ethring.eth" target="_blank" title="Miro Ethring"> <MirrorIcon /> </a>
                <a href="https://x.com/Ethring_io" target="_blank" title="X.com/Twitter Ethring">
                    <XTwitterIcon />
                </a>
                <a href="https://discord.gg/jujUmHVg5Q" target="_blank" title="Discord Ethring"> <DiscordIcon /> </a>
                <a href="https://warpcast.com/ethring.eth" target="_blank" title="Warpcast Ethring"> <WarpcastIcon /> </a>
                <a href="https://hey.xyz/u/ethring" target="_blank" title="Lens Ethring"> <LensIcon /> </a>
            </div>
        </div>

        <div class="footer-block footer-block--left footer-links">
            <a :href="PrivacyPolicy" target="_blank" title="Privacy Policy"> Privacy Policy </a>
            <a :href="TermsOfService" target="_blank" title="Term of service"> T&Cs </a>
            <a href="#" class="disabled" @click.prevent=""> Docs </a>
            <a href="#" @click.prevent="getSurvey"> Send Feedback </a>
            <a
                href="https://docs.google.com/forms/d/1apiOuHXF2t_SHvulN4MG8_jdPYDrGNcFg74DBsZrZsc/edit"
                target="_blank"
                title="Partnership Ethring"
            >
                Partnership
            </a>
        </div>
    </div>
</template>
<script>
import MirrorIcon from '@/assets/icons/socials/mirror.svg';
import XTwitterIcon from '@/assets/icons/socials/x-twitter.svg';
import DiscordIcon from '@/assets/icons/socials/discord-channel.svg';
import WarpcastIcon from '@/assets/icons/socials/warpcast-channel.svg';
import LensIcon from '@/assets/icons/socials/lens.svg';

import PrivacyPolicy from '@/assets/files/privacy-policy.pdf';
import TermsOfService from '@/assets/files/terms-of-service.pdf';

import { usePostHog } from '@/app/compositions/usePostHog';

export default {
    name: 'AppFooter',
    components: {
        MirrorIcon,
        XTwitterIcon,
        DiscordIcon,
        WarpcastIcon,
        LensIcon,
    },

    setup() {
        const { posthog } = usePostHog();

        const SURVEY_ID = '0195b8cf-ad0c-0000-ecdf-014dfdb1077a';

        function getSurvey() {
            if (!posthog) return;
            posthog.capture('survey_opened', { survey_id: SURVEY_ID });
        }

        return {
            PrivacyPolicy,
            TermsOfService,

            getSurvey,
        };
    },
};
</script>
