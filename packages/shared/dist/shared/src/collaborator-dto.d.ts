export interface CollaboratorType {
    color: string;
    name: string;
}
export declare class Collaborator implements CollaboratorType {
    name: string;
    color: string;
    constructor(name: string, color: string);
}
