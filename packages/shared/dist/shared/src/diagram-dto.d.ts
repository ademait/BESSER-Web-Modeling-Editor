import { UMLModel } from '@besser/wme';
export declare class DiagramDTO {
    id: string;
    title: string;
    model: UMLModel;
    lastUpdate: string;
    versions?: DiagramDTO[];
    description?: string;
    token?: string;
    constructor(id: string, title: string, model: UMLModel, lastUpdate: string, versions: DiagramDTO[], token: string);
}
