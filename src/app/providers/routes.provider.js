import { createRouter, createWebHistory } from 'vue-router';
import { routes } from '@/app/routes';

const Router = createRouter({
    history: createWebHistory(),
    routes,
});

Router.beforeResolve((to, from, next) => {
    if (to.name) document.title = to.name;

    if (to.hash && to.hash.includes('/main')) {
        const pathWithoutHash = to.path.replace(to.hash, '');
        next(`/main${pathWithoutHash}`);
    } else {
        next();
    }
});

Router.afterEach((to) => {
    if (window.posthog) window.posthog?.capture('$pageview');
});

export default Router;
