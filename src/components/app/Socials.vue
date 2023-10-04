<template>
    <div class="socials">
        <a class="socials__item telegram disabled">
            <TelegramIcon />
        </a>
        <a class="socials__item twitter" target="_blank" href="https://twitter.com/zometapp">
            <TwitterIcon />
        </a>
        <a class="socials__item discord disabled">
            <DiscordIcon />
        </a>
        <a class="socials__item gitbook disabled">
            <GitbookIcon />
        </a>
    </div>
</template>
<script>
import TelegramIcon from '@/assets/icons/socials/telegram.svg';
import TwitterIcon from '@/assets/icons/socials/twitter.svg';
import DiscordIcon from '@/assets/icons/socials/discord.svg';
import GitbookIcon from '@/assets/icons/socials/gitbook.svg';

export default {
    name: 'Socials',
    components: {
        TelegramIcon,
        TwitterIcon,
        DiscordIcon,
        GitbookIcon,
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

        &:not(.disabled):hover {
            background: var(--#{$prefix}black);
        }

        svg {
            fill: var(--#{$prefix}sidebar-active-color);
        }
    }

    .disabled {
        cursor: not-allowed;
        opacity: 0.5;
    }
}
</style>
