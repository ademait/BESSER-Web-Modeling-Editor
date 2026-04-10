import { AgentElementType } from '..';
import { UMLContainer } from '../../../services/uml-container/uml-container';
import { assign } from '../../../utils/fx/assign';
import { Text } from '../../../utils/svg/text';
import { AgentStateBody } from '../agent-state-body/agent-state-body';
import { AgentStateFallbackBody } from '../agent-state-fallback-body/agent-state-fallback-body';
import { AgentRelationshipType } from '..';
import { GeneralRelationshipType } from '../../uml-relationship-type';
export class AgentState extends UMLContainer {
    get headerHeight() {
        return this.stereotype ? AgentState.stereotypeHeaderHeight : AgentState.nonStereotypeHeaderHeight;
    }
    constructor(values) {
        super();
        this.type = AgentElementType.AgentState;
        this.italic = false;
        this.underline = false;
        this.stereotype = null;
        this.dividerPosition = 0;
        this.hasBody = false;
        this.hasFallbackBody = false;
        assign(this, values);
    }
    reorderChildren(children) {
        const bodies = children.filter((x) => x.type === AgentElementType.AgentStateBody);
        const fallbackBodies = children.filter((x) => x.type === AgentElementType.AgentStateFallbackBody);
        return [...bodies.map((element) => element.id), ...fallbackBodies.map((element) => element.id)];
    }
    serialize(children = []) {
        return {
            ...super.serialize(children),
            type: this.type,
            bodies: children.filter((x) => x instanceof AgentStateBody).map((x) => x.id),
            fallbackBodies: children.filter((x) => x instanceof AgentStateFallbackBody).map((x) => x.id),
        };
    }
    render(layer, children = []) {
        const bodies = children.filter((x) => x instanceof AgentStateBody);
        const fallbackBodies = children.filter((x) => x instanceof AgentStateFallbackBody);
        this.hasBody = bodies.length > 0;
        this.hasFallbackBody = fallbackBodies.length > 0;
        const radix = 10;
        this.bounds.width = [this, ...bodies, ...fallbackBodies].reduce((current, child, index) => Math.max(current, Math.round((Text.size(layer, child.name, index === 0 ? { fontWeight: 'bold' } : undefined).width + 60) / radix) * radix), Math.round(this.bounds.width / radix) * radix);
        let y = this.headerHeight;
        for (const body of bodies) {
            body.bounds.x = 0.5;
            body.bounds.y = y + 0.5;
            body.bounds.width = this.bounds.width - 1;
            y += body.bounds.height;
        }
        this.dividerPosition = y;
        for (const fallbackBody of fallbackBodies) {
            fallbackBody.bounds.x = 0.5;
            fallbackBody.bounds.y = y + 0.5;
            fallbackBody.bounds.width = this.bounds.width - 1;
            y += fallbackBody.bounds.height;
        }
        this.bounds.height = y;
        return [this, ...bodies, ...fallbackBodies];
    }
}
AgentState.features = {
    ...UMLContainer.features,
    droppable: false,
    resizable: 'WIDTH',
};
AgentState.stereotypeHeaderHeight = 50;
AgentState.nonStereotypeHeaderHeight = 40;
AgentState.supportedRelationships = [AgentRelationshipType.AgentStateTransition, AgentRelationshipType.AgentStateTransitionInit, GeneralRelationshipType.Link];
//# sourceMappingURL=agent-state.js.map