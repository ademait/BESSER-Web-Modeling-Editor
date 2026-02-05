import { GeneratorOptions } from '../types/generator-options';
import { CommonAgent } from '../types/common-types';

import { IAgentGroup } from '../../../packages/swarm-diagram/agent-group/agent-group';
import { SwarmElementType } from '../../../packages/swarm-diagram';

export type SwarmAgentRole = IAgentGroup;

export const AGENT_TYPES = [
  SwarmElementType.Dispatcher,  // 'Dispatcher'
  SwarmElementType.Solver,      // 'Solver'
  SwarmElementType.Evaluator,   // 'Evaluator'
  SwarmElementType.Supervisor,  // 'Supervisor'
] as const;

const ROLE_PERSONAS = {
  Dispatcher: {
    goal: "Efficiently route and delegate tasks to specialized agents",
    backstory: "Expert task coordinator with deep understanding of team capabilities",
    allowDelegation: true
  },
  Solver: {
    goal: "Execute assigned tasks with precision and quality",
    backstory: "Specialized problem solver focused on delivering results",
    allowDelegation: false
  },
  Evaluator: {
    goal: "Assess task outputs and ensure quality standards",
    backstory: "Quality assurance expert with keen attention to detail",
    allowDelegation: false
  },
  Supervisor: {
    goal: "Oversee team operations and ensure objectives are achieved",
    backstory: "Experienced leader coordinating multi-agent workflows",
    allowDelegation: true
  }
};

export function mapAgentRoleToCommon(
  agentRole: SwarmAgentRole,
  index: number,
  options: GeneratorOptions
): CommonAgent {
  const roleType = agentRole.type as keyof typeof ROLE_PERSONAS;
  const persona = ROLE_PERSONAS[roleType] || ROLE_PERSONAS.Solver;
  
  // Generate variable name: "solver_1", "solver_2", etc.
  const baseName = agentRole.name.toLowerCase().replace(/\s+/g, '_');
  const variableName = agentRole.numAgents > 1 
    ? `${baseName}_${index + 1}` 
    : baseName;
  
  return {
    variableName,
    name: agentRole.name,
    role: agentRole.type,
    goal: persona.goal,
    backstory: persona.backstory,
    llm: options.defaultLLM,
    allowDelegation: persona.allowDelegation
  };
}

export interface ExpandedRole {
  role: SwarmAgentRole;
  index: number;
}

export function expandAgentRoles(agentRoles: SwarmAgentRole[]): ExpandedRole[] {
  const expanded: ExpandedRole[] = [];
  
  for (const role of agentRoles) {
    const count = role.numAgents || 1;
    for (let i = 0; i < count; i++) {
      expanded.push({ role, index: i });
    }
  }
  
  return expanded;
}

// Example: Solver with numAgents=3 becomes:
// [{ role: Solver, index: 0 }, { role: Solver, index: 1 }, { role: Solver, index: 2 }]

export function mapAgentRolesToCommon(
  agentRoles: SwarmAgentRole[],
  options: GeneratorOptions
): CommonAgent[] {
  const expanded = expandAgentRoles(agentRoles);
  return expanded.map(({ role, index }) => 
    mapAgentRoleToCommon(role, index, options)
  );
}