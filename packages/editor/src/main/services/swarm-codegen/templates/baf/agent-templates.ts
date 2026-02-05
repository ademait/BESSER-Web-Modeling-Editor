import { CommonAgent } from '../../types/common-types';

export function generateBAFAgentCode(agent: CommonAgent): string {
  return `
# Agent: ${agent.name}
${agent.variableName} = Agent(
    name="${agent.name}",
    role="${agent.role}",
    goal="${agent.goal}",
    backstory="${agent.backstory}"
)
`.trim();
}

export function generateAllBAFAgents(agents: CommonAgent[]): string {
  return agents.map(generateBAFAgentCode).join('\n\n');
}