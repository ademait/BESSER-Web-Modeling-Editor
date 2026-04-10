import { UMLElement } from '../../../services/uml-element/uml-element';
import { SwarmElementType } from '..';
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
export class AgentGroup extends UMLElement {
    constructor(values) {
        super(values);
        // TODO: Check whether we can inherit the different supported relationships from subclasses
        // static supportedRelationships = [
        //   SwarmRelationshipType.SwarmLink,
        // ];
        this.type = SwarmElementType.AgentGroup;
        this.numAgents = 1;
        this.framework = 'BESSER-BAF';
        this.persona = '';
        this.role = '';
        this.name = values?.name ?? 'AgentGroup';
        this.numAgents = values?.numAgents ?? 1;
        this.framework = values?.framework ?? 'BESSER-BAF';
        this.persona = values?.persona ?? '';
        this.role = values?.role ?? '';
        // Update default bounds for robot head icon-style rendering
        this.bounds = {
            x: 0,
            y: 0,
            width: AgentGroup.MIN_WIDTH,
            height: AgentGroup.MIN_HEIGHT,
            ...values?.bounds,
        };
    }
    serialize() {
        return {
            ...super.serialize(),
            type: this.type,
            numAgents: this.numAgents,
            framework: this.framework,
            persona: this.persona,
            role: this.role,
        };
    }
    render(canvas) {
        // Enforce minimum dimensions
        if (this.bounds.width < AgentGroup.MIN_WIDTH) {
            this.bounds.width = AgentGroup.MIN_WIDTH;
        }
        if (this.bounds.height < AgentGroup.MIN_HEIGHT) {
            this.bounds.height = AgentGroup.MIN_HEIGHT;
        }
        return [this];
    }
}
AgentGroup.features = {
    ...UMLElement.features,
    resizable: true,
};
AgentGroup.supportedContainers = [SwarmElementType.Swarm];
AgentGroup.MIN_WIDTH = 40;
AgentGroup.MIN_HEIGHT = 60;
//# sourceMappingURL=agent-group.js.map