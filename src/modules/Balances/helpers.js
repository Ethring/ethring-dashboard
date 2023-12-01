import { computed } from 'vue';

const RESET_ACTIONS = [
    ['tokens/setLoader', true],
    ['tokens/setFromToken', null],
    ['tokens/setToToken', null],
    ['bridge/setSelectedSrcNetwork', null],
    ['bridge/setSelectedDstNetwork', null],
];

// =================================================================================================================

async function performActions(actions, store) {
    await Promise.all(actions.map(([action, payload]) => store.dispatch(action, payload)));
}

// =================================================================================================================

export const checkActions = async (store) => {
    const disableLoader = computed(() => store.getters['tokens/disableLoader']);
    const disableLoaderActions = [['tokens/setDisableLoader', false]];
    const actionsToPerform = disableLoader.value ? disableLoaderActions : RESET_ACTIONS;

    performActions(actionsToPerform, store).catch((error) => {
        console.error('An error occurred:', error);
    });
};
