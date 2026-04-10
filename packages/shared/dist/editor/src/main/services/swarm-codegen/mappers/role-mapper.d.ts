import { GeneratorOptions } from '../types/generator-options';
import { CrewAIAgent } from '../types/crewai-types';
import { IAgentGroup } from '../../../packages/swarm-diagram/agent-group/agent-group';
export type SwarmAgentRole = IAgentGroup;
export declare const AGENT_TYPES: readonly ["Dispatcher", "Solver", "Evaluator", "Supervisor"];
export declare function mapAgentRoleToCrewAI(agentRole: SwarmAgentRole, index: number, options: GeneratorOptions): CrewAIAgent;
export interface ExpandedRole {
    role: SwarmAgentRole;
    index: number;
}
export declare function expandAgentRoles(agentRoles: SwarmAgentRole[]): ExpandedRole[];
