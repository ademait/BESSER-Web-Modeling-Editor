import { CrewAICrew } from '../types/crewai-types';
import { generateAllAgentsCode } from './agent-templates';
import { generateAllTasksCode } from './task-templates';


export function generateMainPy(
  crew: CrewAICrew,
  diagramName: string,
  timestamp: string
): string {
  const managerLine = crew.processType === 'hierarchical' && crew.managerAgent
    ? `        manager_agent=${crew.managerAgent},\n`
    : '';
  
  return `#!/usr/bin/env python
"""
Generated CrewAI Swarm from SwarmDiagram
Diagram: ${diagramName}
Generated: ${timestamp}
"""

from crewai import Agent, Crew, Task, Process

# Agents
${generateAllAgentsCode(crew.agents)}

# Tasks
${generateAllTasksCode(crew.tasks)}

def main():
    crew = Crew(
        agents=[${crew.agents.map(a => a.variableName).join(', ')}],
        tasks=[${crew.tasks.map(t => t.variableName).join(', ')}],
        process=Process.${crew.processType},
${managerLine}        verbose=True
    )
    
    result = crew.kickoff(inputs={
        "topic": "Your task description here"
    })
    
    print(result)

if __name__ == "__main__":
    main()
`;
}