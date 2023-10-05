export default async (to, from, next) => {
    const isAuthRequired = to.meta.isAuth;

    const isConnected = JSON.parse(localStorage.getItem('adapter:isConnected'));

    if (!isConnected && to.name !== 'Connect wallet' && isAuthRequired) {
        return next('/connect-wallet');
    } else if (to.name == 'Connect wallet' && isConnected) {
        return next('/');
    }

    return next();
};
