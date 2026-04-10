import { AgentGroup } from '../agent-group/agent-group';
import { SwarmElementType } from '..';
import { SwarmRelationshipType } from '..';
export class Solver extends AgentGroup {
    constructor(values) {
        super(values);
        this.type = SwarmElementType.Solver;
        this.name = values?.name ?? 'Solver';
        this.role = values?.role ?? 'solver';
        this.fillColor = values?.fillColor ?? '#10b981';
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
Solver.supportedRelationships = [
    SwarmRelationshipType.SwarmLink,
    SwarmRelationshipType.DelegationLink,
    SwarmRelationshipType.SupervisionLink,
];
//# sourceMappingURL=solver.js.map