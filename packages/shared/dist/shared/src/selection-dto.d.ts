export interface SelectionChangeType {
    selected: string[];
    deselected: string[];
}
export declare class SelectionChange implements SelectionChangeType {
    selected: string[];
    deselected: string[];
    constructor(selected: string[], deselected: string[]);
}
