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
            <a href="#" class="disabled" @click.prevent=""> Privacy Policy </a>
            <a href="#" class="disabled" @click.prevent="">T&Cs </a>
            <a href="#" class="disabled" @click.prevent=""> Docs </a>
            <a href="#" class="disabled" @click.prevent=""> Send Feedback </a>
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

export default {
    name: 'AppFooter',
    components: {
        MirrorIcon,
        XTwitterIcon,
        DiscordIcon,
        WarpcastIcon,
        LensIcon,
    },
};
</script>
