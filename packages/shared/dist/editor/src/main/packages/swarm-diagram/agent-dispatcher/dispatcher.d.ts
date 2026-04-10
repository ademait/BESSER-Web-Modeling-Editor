import { DeepPartial } from 'redux';
import { AgentGroup, IAgentGroup } from '../agent-group/agent-group';
import { UMLElementType } from '../../uml-element-type';
export interface IDispatcher extends IAgentGroup {
}
export declare class Dispatcher extends AgentGroup implements IDispatcher {
    type: UMLElementType;
    static supportedRelationships: ("SwarmLink" | "DelegationLink" | "SupervisionLink")[];
    constructor(values?: DeepPartial<IDispatcher>);
}
