<template>
    <a-row class="shortcut-info-container">
        <div class="shortcut-info">
            <div class="shortcut-info__label">{{ $t('shortcuts.label') }}</div>
            <div class="shortcut-info__desc">{{ $t('shortcuts.description') }}</div>
        </div>
        <div class="shortcut-info__btn">
            <Button title="Soon" />
        </div>
        <LinesBack class="shortcut-info-lines" />
    </a-row>
</template>
<script>
import LinesBack from '@/assets/images/wallet-info/lines.svg';

export default {
    name: 'ShortcutInfoLarge',
    components: {
        LinesBack,
    },
    setup() {},
};
</script>

