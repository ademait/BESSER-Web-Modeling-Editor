// Type guard for SET_PALETTE action
function isSetPaletteAction(action) {
    return (action.type === "@@palette/SET_PALETTE" /* PaletteActionTypes.SET_PALETTE */ &&
        Array.isArray(action.payload));
}
export const PaletteReducer = (state = [], action) => {
    switch (action.type) {
        case "@@palette/SET_PALETTE" /* PaletteActionTypes.SET_PALETTE */: {
            // Only set to empty if payload is explicitly empty, otherwise keep previous state
            return isSetPaletteAction(action) ? action.payload : state;
        }
        default:
            return state;
    }
};
//# sourceMappingURL=palette-reducer.js.map