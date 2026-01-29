import { CrewAIAgent, CrewAITask } from '../types/crewai-types';

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


export function generateTaskForAgent(agent: CrewAIAgent, roleType: string): CrewAITask {
  const taskTemplate = ROLE_TASKS[roleType as keyof typeof ROLE_TASKS] 
    || ROLE_TASKS.Solver;
  
  return {
    variableName: `${agent.variableName}_task`,
    description: taskTemplate.description,
    expectedOutput: taskTemplate.expectedOutput,
    agentVariableName: agent.variableName
  };
}