import { createStore } from 'vuex';

import { describe, test, expect } from 'vitest';

import { shallowMount } from '@vue/test-utils';

import SidebarTrigger from '@/app/layouts/DefaultLayout/sidebar/SidebarTrigger';

import MenuIcon from '@/assets/icons/sidebar/arrow-open.svg';

const COLLAPSED_SIDEBAR_KEY = 'user-settings:sidebar-collapsed';

const store = createStore({
    state: {
        isCollapsed: false,
    },
    mutations: {
        toggleSidebar(state) {
            state.isCollapsed = !state.isCollapsed;
            localStorage.setItem(COLLAPSED_SIDEBAR_KEY, state.isCollapsed);
        },
    },
});

const wrapper = shallowMount(SidebarTrigger, { global: { plugins: [store] } });

describe('Collapsed Sidebar', () => {
    test('Case #1. Check collapsed sidebar icon', () => {
        localStorage.setItem(COLLAPSED_SIDEBAR_KEY, store.state.isCollapsed);
        expect(wrapper.findComponent(MenuIcon).exists()).toBe(true);
    });

    test('Case #2. Check localStorage value after toggle sidebar', async () => {
        store.commit('toggleSidebar');
        expect(store.state.isCollapsed).toBe(true);
    });
});
