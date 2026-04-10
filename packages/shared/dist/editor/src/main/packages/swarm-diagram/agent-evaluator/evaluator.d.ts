import { DeepPartial } from 'redux';
import { AgentGroup, IAgentGroup } from '../agent-group/agent-group';
import { UMLElementType } from '../../uml-element-type';
export interface IEvaluator extends IAgentGroup {
}
export declare class Evaluator extends AgentGroup implements IEvaluator {
    type: UMLElementType;
    static supportedRelationships: ("SwarmLink" | "SupervisionLink")[];
    constructor(values?: DeepPartial<IEvaluator>);
}
