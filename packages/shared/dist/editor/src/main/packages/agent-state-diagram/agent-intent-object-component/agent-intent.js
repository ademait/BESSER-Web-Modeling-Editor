import { AgentElementType } from '..';
import { UMLContainer } from '../../../services/uml-container/uml-container';
import { assign } from '../../../utils/fx/assign';
import { Text } from '../../../utils/svg/text';
import { AgentIntentBody } from '../agent-intent-body/agent-intent-body';
export class AgentIntent extends UMLContainer {
    get headerHeight() {
        return this.stereotype ? AgentIntent.stereotypeHeaderHeight : AgentIntent.nonStereotypeHeaderHeight;
    }
    constructor(values) {
        super();
        this.type = AgentElementType.AgentIntent;
        this.italic = false;
        this.underline = false;
        this.stereotype = null;
        this.deviderPosition = 0;
        this.hasBody = false;
        assign(this, values);
    }
    reorderChildren(children) {
        const bodies = children.filter((x) => x.type === AgentElementType.AgentIntentBody);
        return [...bodies.map((element) => element.id)];
    }
    serialize(children = []) {
        return {
            ...super.serialize(children),
            type: this.type,
            bodies: children.filter((x) => x instanceof AgentIntentBody).map((x) => x.id)
        };
    }
    render(layer, children = []) {
        const bodies = children.filter((x) => x instanceof AgentIntentBody);
        this.hasBody = bodies.length > 0;
        const radix = 10;
        this.bounds.width = [this, ...bodies].reduce((current, child, index) => Math.max(current, Math.round((Text.size(layer, child.name, index === 0 ? { fontWeight: 'bold' } : undefined).width + 110) / radix) * radix), Math.round(this.bounds.width / radix) * radix);
        let y = this.headerHeight;
        for (const body of bodies) {
            body.bounds.x = 0.5;
            body.bounds.y = y + 0.5;
            body.bounds.width = this.bounds.width - 1;
            y += body.bounds.height;
        }
        this.deviderPosition = y;
        this.bounds.height = y;
        return [this, ...bodies];
    }
}
AgentIntent.features = {
    ...UMLContainer.features,
    droppable: false,
    resizable: 'WIDTH',
};
AgentIntent.stereotypeHeaderHeight = 50;
AgentIntent.nonStereotypeHeaderHeight = 40;
//# sourceMappingURL=agent-intent.js.map