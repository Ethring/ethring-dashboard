export default async (to, from, next) => {
    const isAuthenticated = JSON.parse(localStorage.getItem('isAuthenticated'));

    if (!isAuthenticated && to.name !== 'Connect wallet') {
        return next('/connect-wallet');
    } else if (to.name == 'Connect wallet' && isAuthenticated) {
        return next('/');
    }

    return next();
};
