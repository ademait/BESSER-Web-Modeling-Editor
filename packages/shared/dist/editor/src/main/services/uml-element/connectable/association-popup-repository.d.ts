import { AsyncAction } from '../../../utils/actions/actions';
export declare const enum AssociationPopupActionTypes {
    OPEN = "@@element/association-popup/OPEN",
    CLOSE = "@@element/association-popup/CLOSE",
    CLOSE_ALL = "@@element/association-popup/CLOSE_ALL"
}
export type AssociationPopupState = {
    sourceObjectId: string | null;
    isIconObjectDiagram: boolean | null;
    isOpen: boolean;
};
export type AssociationPopupActions = OpenAssociationPopupAction | CloseAssociationPopupAction | CloseAllAssociationPopupsAction;
export type OpenAssociationPopupAction = {
    type: AssociationPopupActionTypes.OPEN;
    payload: {
        sourceObjectId: string;
        isIconObjectDiagram?: boolean;
    };
    undoable: false;
};
export type CloseAssociationPopupAction = {
    type: AssociationPopupActionTypes.CLOSE;
    payload: {};
    undoable: false;
};
export type CloseAllAssociationPopupsAction = {
    type: AssociationPopupActionTypes.CLOSE_ALL;
    payload: {};
    undoable: false;
};
export declare const AssociationPopup: {
    open: (sourceObjectId: string, isIconObjectDiagram?: boolean) => AsyncAction;
    close: () => AsyncAction;
    closeAll: () => AsyncAction;
};
