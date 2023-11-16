<template>
    <div class="socials" :class="{ collapsed: collapsed }">
        <a class="socials__item telegram disabled">
            <TelegramIcon />
        </a>
        <a class="socials__item twitter" target="_blank" href="https://twitter.com/zometapp">
            <TwitterIcon />
        </a>
        <a class="socials__item discord disabled">
            <DiscordIcon />
        </a>
        <a class="socials__item git-book disabled">
            <GitBookIcon />
        </a>
    </div>
</template>
<script>
import TelegramIcon from '@/assets/icons/socials/telegram.svg';
import TwitterIcon from '@/assets/icons/socials/twitter.svg';
import DiscordIcon from '@/assets/icons/socials/discord.svg';
import GitBookIcon from '@/assets/icons/socials/git-book.svg';

export default {
    name: 'Socials',
    components: {
        TelegramIcon,
        TwitterIcon,
        DiscordIcon,
        GitBookIcon,
    },
    props: {
        collapsed: {
            type: Boolean,
            required: false,
        },
    },
};
</script>
<style lang="scss" scoped>
.socials {
    @include pageFlexRow;
    justify-content: space-between;

    &__item {
        @include pageFlexRow;
        justify-content: center;

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

    &.collapsed {
        .socials__item {
            width: 32px;
            height: 32px;

            &:not(:last-child) {
                margin-bottom: 10px;
            }
        }
    }
}
</style>
