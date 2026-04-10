import { AgentGroup } from '../agent-group/agent-group';
import { SwarmElementType } from '..';
import { SwarmRelationshipType } from '..';
export class Evaluator extends AgentGroup {
    constructor(values) {
        super(values);
        this.type = SwarmElementType.Evaluator;
        this.name = values?.name ?? 'Evaluator';
        this.role = values?.role ?? 'evaluator';
        this.fillColor = values?.fillColor ?? '#f59e0b';
        // Update default bounds for robot head icon-style rendering
        this.bounds = {
            x: 0,
            y: 0,
            width: 60,
            height: 80,
            ...values?.bounds,
        };
    }
}
Evaluator.supportedRelationships = [
    SwarmRelationshipType.SwarmLink,
    SwarmRelationshipType.SupervisionLink,
];
//# sourceMappingURL=evaluator.js.map