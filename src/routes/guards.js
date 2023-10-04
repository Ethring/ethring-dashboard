export default async (to, from, next) => {
    const isAuthRequired = to.meta.isAuth;

    if (isAuthRequired) {

        const isAuthenticated = true; // TODO

        if (!isAuthenticated) {
            return next({ params: { redirect: '/login' }});
        }
    }

    next();
};
