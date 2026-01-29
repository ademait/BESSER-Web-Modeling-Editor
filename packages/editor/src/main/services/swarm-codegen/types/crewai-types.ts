export interface CrewAIAgent {
  variableName: string;         // e.g., 'solver_1'
  role: string;                 // e.g., 'Problem Solver'
  goal: string;
  backstory: string;
  llm: string;
  allowDelegation: boolean;
  verbose: boolean;
}

export interface CrewAITask {
  variableName: string;         // e.g., 'solve_task_1'
  description: string;
  expectedOutput: string;
  agentVariableName: string;    // Reference to agent
}

export interface CrewAICrew {
  agents: CrewAIAgent[];
  tasks: CrewAITask[];
  processType: 'sequential' | 'hierarchical';
  managerAgent?: string;        // For hierarchical process
}