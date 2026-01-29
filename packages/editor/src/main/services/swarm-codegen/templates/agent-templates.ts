import { CrewAIAgent } from '../types/crewai-types';


export function generateAgentCode(agent: CrewAIAgent): string {
  return `${agent.variableName} = Agent(
    role="${agent.role}",
    goal="${agent.goal}",
    backstory="${agent.backstory}",
    llm="${agent.llm}",
    allow_delegation=${agent.allowDelegation ? 'True' : 'False'},
    verbose=${agent.verbose ? 'True' : 'False'}
)`;
}

export function generateAllAgentsCode(agents: CrewAIAgent[]): string {
  return agents
    .map(agent => generateAgentCode(agent))
    .join('\n\n');
}