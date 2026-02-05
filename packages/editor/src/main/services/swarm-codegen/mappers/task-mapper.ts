import { CommonAgent, CommonTask } from '../types/common-types';

const ROLE_TASKS = {
  Dispatcher: {
    description: "Analyze incoming requests and delegate to appropriate agents",
    expectedOutput: "Task assignments with clear instructions"
  },
  Solver: {
    description: "Process the assigned task and produce the requested output",
    expectedOutput: "Complete task deliverable meeting requirements"
  },
  Evaluator: {
    description: "Review and validate the quality of completed work",
    expectedOutput: "Quality assessment with pass/fail status and feedback"
  },
  Supervisor: {
    description: "Coordinate team activities and monitor progress",
    expectedOutput: "Status report and team coordination decisions"
  }
};


export function generateTaskForCommonAgent(agent: CommonAgent, roleType?: string): CommonTask {
  // Infer roleType from agent.role if not provided
  const inferredRoleType = roleType || inferRoleType(agent.role);
  const taskTemplate = ROLE_TASKS[inferredRoleType as keyof typeof ROLE_TASKS] 
    || ROLE_TASKS.Solver;
  
  return {
    variableName: `${agent.variableName}_task`,
    description: taskTemplate.description,
    expectedOutput: taskTemplate.expectedOutput,
    agentVariableName: agent.variableName
  };
}

// Helper to infer role type from agent role string
function inferRoleType(role: string): string {
  const roleLower = role.toLowerCase();
  if (roleLower.includes('dispatch')) return 'Dispatcher';
  if (roleLower.includes('evaluat')) return 'Evaluator';
  if (roleLower.includes('supervis') || roleLower.includes('manager')) return 'Supervisor';
  return 'Solver';
}

// Convenience function to generate tasks for all agents
export function generateTasksForAgents(agents: CommonAgent[]): CommonTask[] {
  return agents.map(agent => generateTaskForCommonAgent(agent));
}