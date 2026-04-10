import { DeepPartial } from 'redux';
import { IUMLElement, UMLElement } from '../../../services/uml-element/uml-element';
import { UMLElementFeatures } from '../../../services/uml-element/uml-element-features';
import { UMLElementType } from '../../uml-element-type';
import { ILayoutable } from '../../../services/layouter/layoutable';
import { ILayer } from '../../../services/layouter/layer';
import * as Apollon from '../../../typings';
export interface IAgentGroup extends IUMLElement {
    numAgents: number;
    framework: string;
    persona: string;
    role: string;
}
/**
 * AgentGroup - Abstract base class for all agent types in a Swarm diagram.
 *
 * This class should NOT be instantiated directly. Use one of the concrete subclasses:
 * - Evaluator
 * - Solver
 * - Supervisor
 * - Dispatcher
 *
 * AgentGroup provides common properties and behavior for all agent types.
 */
export declare class AgentGroup extends UMLElement implements IAgentGroup {
    static features: UMLElementFeatures;
    static supportedContainers: "Swarm"[];
    static MIN_WIDTH: number;
    static MIN_HEIGHT: number;
    type: UMLElementType;
    numAgents: number;
    framework: string;
    persona: string;
    role: string;
    constructor(values?: DeepPartial<IAgentGroup>);
    serialize(): Apollon.AgentGroup;
    render(canvas: ILayer): ILayoutable[];
}
