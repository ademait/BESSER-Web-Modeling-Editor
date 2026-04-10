import { UMLContainer } from '../../../services/uml-container/uml-container';
import { assign } from '../../../utils/fx/assign';
import { SwarmElementType } from '..';
export class Swarm extends UMLContainer {
    constructor(values) {
        super(values);
        this.type = SwarmElementType.Swarm;
        this.framework = 'BESSER-BAF';
        assign(this, values);
        this.name = values?.name ?? 'Swarm';
        this.framework = values?.framework ?? 'BESSER-BAF';
        this.bounds = {
            x: 0,
            y: 0,
            width: Swarm.MIN_WIDTH,
            height: Swarm.MIN_HEIGHT,
            ...values?.bounds,
        };
    }
    serialize(children = []) {
        return {
            ...super.serialize(children),
            type: this.type,
            framework: this.framework,
        };
    }
    render(canvas, children = []) {
        // Ensure minimum dimensions
        if (this.bounds.width < Swarm.MIN_WIDTH) {
            this.bounds.width = Swarm.MIN_WIDTH;
        }
        if (this.bounds.height < Swarm.MIN_HEIGHT) {
            this.bounds.height = Swarm.MIN_HEIGHT;
        }
        // children to stay within Swarm bounds
        const padding = 10;
        const headerHeight = Swarm.HEADER_HEIGHT;
        for (const child of children) {
            child.bounds.x = Math.max(padding, Math.min(child.bounds.x, this.bounds.width - child.bounds.width - padding));
            // Y (below header)
            child.bounds.y = Math.max(headerHeight + padding, Math.min(child.bounds.y, this.bounds.height - child.bounds.height - padding));
        }
        // Return self and all children
        return [this, ...children];
    }
}
Swarm.features = {
    ...UMLContainer.features,
    resizable: true, // Can resize width and height
    droppable: true,
};
Swarm.HEADER_HEIGHT = 50;
Swarm.MIN_WIDTH = 200;
Swarm.MIN_HEIGHT = 150;
//# sourceMappingURL=swarm.js.map