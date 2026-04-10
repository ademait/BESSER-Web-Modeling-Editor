import { GeneratorOptions } from '../types/generator-options';
import { ISwarm } from '../../../packages/swarm-diagram/swarm/swarm';
import { IAgentGroup } from '../../../packages/swarm-diagram/agent-group/agent-group';
import { IUMLRelationship } from '../../uml-relationship/uml-relationship';
/**
 * SwarmDiagramData represents the data needed for code generation.
 * In practice, this is extracted from the editor's element repository.
 */
export interface SwarmDiagramData {
    swarm: ISwarm;
    agents: IAgentGroup[];
    relationships: IUMLRelationship[];
}
export declare function determineProcessType(diagramData: SwarmDiagramData, options: GeneratorOptions): 'sequential' | 'hierarchical';
