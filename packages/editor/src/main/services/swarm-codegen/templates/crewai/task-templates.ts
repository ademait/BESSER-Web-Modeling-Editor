import { CrewAITask } from '../../types/crewai-types';


export function generateTaskCode(task: CrewAITask): string {
  return `${task.variableName} = Task(
    description="${task.description}",
    expected_output="${task.expectedOutput}",
    agent=${task.agentVariableName}
)`;
}

export function generateAllTasksCode(tasks: CrewAITask[]): string {
  return tasks
    .map(task => generateTaskCode(task))
    .join('\n\n');
}