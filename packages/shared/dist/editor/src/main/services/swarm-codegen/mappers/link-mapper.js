import { SwarmElementType, SwarmRelationshipType } from '../../../packages/swarm-diagram';
// TODO: This is a simple heuristic. May need to be more sophisticated in the future.
export function determineProcessType(diagramData, options) {
    if (options.processType !== 'auto') {
        return options.processType;
    }
    const hasSupervisor = diagramData.agents.some(agent => agent.type === SwarmElementType.Supervisor);
    const hasSupervisionLink = diagramData.relationships.some(rel => rel.type === SwarmRelationshipType.SupervisionLink);
    return (hasSupervisor || hasSupervisionLink) ? 'hierarchical' : 'sequential';
}
//# sourceMappingURL=link-mapper.js.map