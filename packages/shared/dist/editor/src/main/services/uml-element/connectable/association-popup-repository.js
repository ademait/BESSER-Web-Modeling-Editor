export const AssociationPopup = {
    open: (sourceObjectId, isIconObjectDiagram) => (dispatch) => {
        dispatch({
            type: "@@element/association-popup/OPEN" /* AssociationPopupActionTypes.OPEN */,
            payload: { sourceObjectId, isIconObjectDiagram },
            undoable: false,
        });
    },
    close: () => (dispatch) => {
        dispatch({
            type: "@@element/association-popup/CLOSE" /* AssociationPopupActionTypes.CLOSE */,
            payload: {},
            undoable: false,
        });
    },
    closeAll: () => (dispatch) => {
        dispatch({
            type: "@@element/association-popup/CLOSE_ALL" /* AssociationPopupActionTypes.CLOSE_ALL */,
            payload: {},
            undoable: false,
        });
    },
};
//# sourceMappingURL=association-popup-repository.js.map