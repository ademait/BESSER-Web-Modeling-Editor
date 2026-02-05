export type SupportedFramework = 'BESSER-BAF' | 'CrewAI';

export interface CommonAgent {
  variableName: string;
  name: string;
  role: string;
  goal: string;
  backstory: string;
  llm?: string;
  allowDelegation: boolean;
}

export interface CommonTask {
  variableName: string;
  description: string;
  expectedOutput: string;
  agentVariableName: string;
}

export interface CommonSwarm {
  name: string;
  framework: SupportedFramework;
  agents: CommonAgent[];
  tasks: CommonTask[];
  processType: 'sequential' | 'hierarchical' | 'auto';
  managerAgent?: string;
}