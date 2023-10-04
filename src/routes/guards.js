import useAdapter from '@/Adapter/compositions/useAdapter';

export default async (to, from, next) => {
    const isAuthRequired = to.meta.isAuth;

    const { walletAccount } = useAdapter();

    const isAccountExist = () => {
        return walletAccount.value;
    };

    if (isAuthRequired) {
        const isAuthenticated = isAccountExist();

        if (!isAuthenticated) {
            return next({ name: "Home" });
        }
    }

    return next();
};
