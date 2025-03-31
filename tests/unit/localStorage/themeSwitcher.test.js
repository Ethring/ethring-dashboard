import Vuex from 'vuex';

import { describe, expect, test } from 'vitest';

import { shallowMount } from '@vue/test-utils';

import ThemeSwitcher from '@/app/layouts/DefaultLayout/header/ThemeSwitcher.vue';

import SunIcon from '@/assets/icons/platform-icons/sun.svg';
import MoonIcon from '@/assets/icons/platform-icons/moon.svg';

describe('ThemeSwitcher', () => {
    const store = new Vuex.Store({
        state: {
            theme: 'light',
        },
        getters: {
            'app/theme': (state) => state.theme,
        },
        mutations: {
            SET_THEME: (state, theme) => {
                state.theme = theme;
            },
        },
        actions: {
            toggleTheme: ({ commit }) => {
                const theme = store.state.theme === 'light' ? 'dark' : 'light';
                localStorage.setItem('theme', theme);
                commit('SET_THEME', theme);
            },
        },
    });

    const wrapper = shallowMount(ThemeSwitcher, { global: { plugins: [store] } });

    test('Case #1. Calls store action "app/toggleTheme" when clicked', async () => {
        localStorage.setItem('theme', store.state.theme);

        await store.dispatch('toggleTheme');
        expect(localStorage.getItem('theme')).toBe('dark');
    });

    test('Case #2. Renders SunIcon when theme is light', () => {
        localStorage.setItem('theme', store.state.theme);
        expect(wrapper.findComponent(SunIcon).exists()).toBe(true);
    });

    test('Case #3. Renders MoonIcon when theme is dark', async () => {
        await store.dispatch('toggleTheme');
        expect(wrapper.findComponent(MoonIcon).exists()).toBe(true);
    });
});
