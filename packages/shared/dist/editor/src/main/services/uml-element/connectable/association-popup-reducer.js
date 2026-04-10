const initialState = {
    sourceObjectId: null,
    isIconObjectDiagram: null,
    isOpen: false,
};
export const AssociationPopupReducer = (state = initialState, action) => {
    switch (action.type) {
        case "@@element/association-popup/OPEN" /* AssociationPopupActionTypes.OPEN */: {
            const { payload } = action;
            return {
                sourceObjectId: payload.sourceObjectId,
                isIconObjectDiagram: payload.isIconObjectDiagram || null,
                isOpen: true,
            };
        }
        case "@@element/association-popup/CLOSE" /* AssociationPopupActionTypes.CLOSE */: {
            return {
                ...state,
                isOpen: false,
            };
        }
        case "@@element/association-popup/CLOSE_ALL" /* AssociationPopupActionTypes.CLOSE_ALL */: {
            return initialState;
        }
    }
    return state;
};
//# sourceMappingURL=association-popup-reducer.js.map