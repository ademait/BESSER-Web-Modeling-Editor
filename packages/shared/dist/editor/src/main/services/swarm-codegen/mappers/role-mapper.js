import { SwarmElementType } from '../../../packages/swarm-diagram';
export const AGENT_TYPES = [
    SwarmElementType.Dispatcher, // 'Dispatcher'
    SwarmElementType.Solver, // 'Solver'
    SwarmElementType.Evaluator, // 'Evaluator'
    SwarmElementType.Supervisor, // 'Supervisor'
];
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
export function mapAgentRoleToCrewAI(agentRole, index, options) {
    const roleType = agentRole.type;
    const persona = ROLE_PERSONAS[roleType] || ROLE_PERSONAS.Solver;
    // Generate variable name: "solver_1", "solver_2", etc.
    const baseName = agentRole.name.toLowerCase().replace(/\s+/g, '_');
    const variableName = agentRole.numAgents > 1
        ? `${baseName}_${index + 1}`
        : baseName;
    return {
        variableName,
        role: agentRole.name,
        goal: persona.goal,
        backstory: persona.backstory,
        llm: options.defaultLLM,
        allowDelegation: persona.allowDelegation,
        verbose: options.verbose
    };
}
export function expandAgentRoles(agentRoles) {
    const expanded = [];
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
//# sourceMappingURL=role-mapper.js.map