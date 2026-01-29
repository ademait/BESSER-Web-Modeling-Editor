import { GeneratorOptions } from '../types/generator-options';

import { ISwarm } from '../../../packages/swarm-diagram/swarm/swarm';
import { SwarmElementType, SwarmRelationshipType } from '../../../packages/swarm-diagram';
import { IAgentGroup } from '../../../packages/swarm-diagram/agent-group/agent-group';
import { IUMLRelationship } from '../../uml-relationship/uml-relationship';

/**
 * SwarmDiagramData represents the data needed for code generation.
 * In practice, this is extracted from the editor's element repository.
 */
export interface SwarmDiagramData {
  swarm: ISwarm;                      // The main Swarm container
  agents: IAgentGroup[];              // All agent elements (Solver, Dispatcher, etc.)
  relationships: IUMLRelationship[];  // All links (DelegationLink, SupervisionLink, etc.)
}

// TODO: This is a simple heuristic. May need to be more sophisticated in the future.
export function determineProcessType(
  diagramData: SwarmDiagramData,
  options: GeneratorOptions
): 'sequential' | 'hierarchical' {
  if (options.processType !== 'auto') {
    return options.processType as 'sequential' | 'hierarchical';
  }
  
  const hasSupervisor = diagramData.agents.some(
    agent => agent.type === SwarmElementType.Supervisor
  );
  
  const hasSupervisionLink = diagramData.relationships.some(
    rel => rel.type === SwarmRelationshipType.SupervisionLink
  );
  
  return (hasSupervisor || hasSupervisionLink) ? 'hierarchical' : 'sequential';
}