<template>
    <a-button type="link" class="socials__item" :title="name" :class="{ disabled }" target="_blank" :href="link" :disabled="disabled">
        <component :is="icon" />
    </a-button>
</template>
<script>
import TelegramIcon from '@/assets/icons/socials/telegram.svg';
import TwitterIcon from '@/assets/icons/socials/twitter.svg';
import DiscordIcon from '@/assets/icons/socials/discord.svg';
import GitBookIcon from '@/assets/icons/socials/git-book.svg';

export default {
    name: 'SocialItem',
    components: {
        TelegramIcon,
        TwitterIcon,
        DiscordIcon,
        GitBookIcon,
    },
    props: {
        name: {
            type: String,
            required: true,
        },
        link: {
            type: String,
            required: true,
        },
        icon: {
            type: String,
            required: true,
        },
        disabled: {
            type: Boolean,
            default: false,
        },
    },
};
</script>
<style lang="scss" scoped>
.socials__item {
    display: flex;
    align-items: center;
    justify-content: center;

    width: 48px;
    height: 32px;

    max-width: 48px;
    max-height: 32px;

    border: 1px solid var(--#{$prefix}social-border-color);
    border-radius: 8px;

    padding: 0;

    cursor: pointer;

    &:not(.disabled):hover {
        background: var(--#{$prefix}black);
        border-color: var(--#{$prefix}sidebar-active-color);
    }

    &:not(.disabled) svg,
    &:not(.disabled) svg path {
        fill: var(--#{$prefix}sidebar-active-color);
    }

    &.disabled {
        cursor: not-allowed;
        opacity: 0.5;
        border-color: var(--#{$prefix}icon-disabled);
    }
}
</style>
