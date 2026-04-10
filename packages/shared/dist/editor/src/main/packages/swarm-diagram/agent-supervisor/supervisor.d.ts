import { DeepPartial } from 'redux';
import { AgentGroup, IAgentGroup } from '../agent-group/agent-group';
import { UMLElementType } from '../../uml-element-type';
export interface ISupervisor extends IAgentGroup {
}
export declare class Supervisor extends AgentGroup implements ISupervisor {
    type: UMLElementType;
    static supportedRelationships: ("SwarmLink" | "SupervisionLink")[];
    constructor(values?: DeepPartial<ISupervisor>);
}
