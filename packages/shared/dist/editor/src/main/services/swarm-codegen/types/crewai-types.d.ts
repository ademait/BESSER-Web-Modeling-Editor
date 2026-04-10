export interface CrewAIAgent {
    variableName: string;
    role: string;
    goal: string;
    backstory: string;
    llm: string;
    allowDelegation: boolean;
    verbose: boolean;
}
export interface CrewAITask {
    variableName: string;
    description: string;
    expectedOutput: string;
    agentVariableName: string;
}
export interface CrewAICrew {
    agents: CrewAIAgent[];
    tasks: CrewAITask[];
    processType: 'sequential' | 'hierarchical';
    managerAgent?: string;
}
