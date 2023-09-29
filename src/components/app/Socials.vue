<template>
    <div class="socials">
        <a class="socials__item telegram">
            <TelegramSvg />
        </a>
        <a class="socials__item twitter" target="_blank" href="https://twitter.com/zometapp">
            <TwitterSvg />
        </a>
        <a class="socials__item discord">
            <DiscordSvg />
        </a>
        <a class="socials__item gitbook">
            <GitbookSvg />
        </a>
    </div>
</template>
<script>
import TelegramSvg from '@/assets/icons/socials/telegram.svg';
import TwitterSvg from '@/assets/icons/socials/twitter.svg';
import DiscordSvg from '@/assets/icons/socials/discord.svg';
import GitbookSvg from '@/assets/icons/socials/gitbook.svg';

export default {
    name: 'Socials',
    components: {
        TelegramSvg,
        TwitterSvg,
        DiscordSvg,
        GitbookSvg,
    },
};
</script>
<style lang="scss" scoped>
.socials {
    display: flex;
    align-items: center;
    justify-content: space-between;

    &__item {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 40px;
        height: 40px;
        border: 1px solid var(--#{$prefix}social-border-color);
        border-radius: 8px;
        cursor: pointer;

        svg {
            fill: var(--#{$prefix}sidebar-active-color);
        }
    }

    .telegram, 
    .discord, 
    .gitbook {
        cursor: not-allowed;
    }
}
</style>
