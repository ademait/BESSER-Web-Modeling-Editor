import { DeepPartial } from 'redux';
import { AgentGroup, IAgentGroup } from '../agent-group/agent-group';
import { UMLElementType } from '../../uml-element-type';
export interface ISolver extends IAgentGroup {
}
export declare class Solver extends AgentGroup implements ISolver {
    type: UMLElementType;
    static supportedRelationships: ("SwarmLink" | "DelegationLink" | "SupervisionLink")[];
    constructor(values?: DeepPartial<ISolver>);
}
