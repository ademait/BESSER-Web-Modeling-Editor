import { StateElementType, StateRelationshipType } from '..';
import { UMLContainer } from '../../../services/uml-container/uml-container';
import { assign } from '../../../utils/fx/assign';
import { Text } from '../../../utils/svg/text';
import { UMLStateBody } from '../uml-state-body/uml-state-body';
import { UMLStateFallbackBody } from '../uml-state-fallback_body/uml-state-fallback_body';
import { GeneralRelationshipType } from '../../uml-relationship-type';
export class UMLState extends UMLContainer {
    get headerHeight() {
        return this.stereotype ? UMLState.stereotypeHeaderHeight : UMLState.nonStereotypeHeaderHeight;
    }
    constructor(values) {
        super();
        this.type = StateElementType.State;
        this.italic = false;
        this.underline = false;
        this.stereotype = null;
        this.deviderPosition = 0;
        this.hasBody = false;
        this.hasFallbackBody = false;
        assign(this, values);
    }
    reorderChildren(children) {
        const bodies = children.filter((x) => x.type === StateElementType.StateBody);
        const fallbackBodies = children.filter((x) => x.type === StateElementType.StateFallbackBody);
        return [...bodies.map((element) => element.id), ...fallbackBodies.map((element) => element.id)];
    }
    serialize(children = []) {
        return {
            ...super.serialize(children),
            type: this.type,
            bodies: children.filter((x) => x instanceof UMLStateBody).map((x) => x.id),
            fallbackBodies: children.filter((x) => x instanceof UMLStateFallbackBody).map((x) => x.id),
        };
    }
    render(layer, children = []) {
        const bodies = children.filter((x) => x instanceof UMLStateBody);
        const fallbackBodies = children.filter((x) => x instanceof UMLStateFallbackBody);
        this.hasBody = bodies.length > 0;
        this.hasFallbackBody = fallbackBodies.length > 0;
        const radix = 10;
        this.bounds.width = [this, ...bodies, ...fallbackBodies].reduce((current, child, index) => Math.max(current, Math.round((Text.size(layer, child.name, index === 0 ? { fontWeight: 'bold' } : undefined).width + 20) / radix) * radix), Math.round(this.bounds.width / radix) * radix);
        let y = this.headerHeight;
        for (const body of bodies) {
            body.bounds.x = 0.5;
            body.bounds.y = y + 0.5;
            body.bounds.width = this.bounds.width - 1;
            y += body.bounds.height;
        }
        this.deviderPosition = y;
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
UMLState.features = {
    ...UMLContainer.features,
    droppable: false,
    resizable: 'WIDTH',
};
UMLState.stereotypeHeaderHeight = 50;
UMLState.nonStereotypeHeaderHeight = 40;
UMLState.supportedRelationships = [
    StateRelationshipType.StateTransition,
    GeneralRelationshipType.Link,
];
//# sourceMappingURL=uml-state.js.map