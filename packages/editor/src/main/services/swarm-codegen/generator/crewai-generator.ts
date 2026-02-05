import { GeneratorOptions, GeneratorResult, GeneratedFile } from '../types/generator-options';
import { CrewAICrew, CrewAIAgent, CrewAITask } from '../types/crewai-types';
import { CommonAgent, CommonTask, CommonSwarm, SupportedFramework } from '../types/common-types';
import { mapAgentRolesToCommon, AGENT_TYPES } from '../mappers/role-mapper';
import { generateTasksForAgents } from '../mappers/task-mapper';
import { determineProcessType, SwarmDiagramData } from '../mappers/link-mapper';
import { generateMainPy } from '../templates/crewai/crew-templates';
import { generateRequirementsTxt, generateReadme } from '../templates/crewai/config-templates';
import { BaseSwarmGenerator } from './base-generator';

export class CrewAIGenerator extends BaseSwarmGenerator {
  readonly framework: SupportedFramework = 'CrewAI';
  
  constructor(options: Partial<GeneratorOptions> = {}) {
    super(options);
  }
  
  generate(diagramData: SwarmDiagramData): GeneratorResult {
    const timestamp = new Date().toISOString();
    const diagramName = diagramData.swarm.name || 'SwarmDiagram';
    
    // 1. Filter to only agent types (Solver, Dispatcher, Evaluator, Supervisor)
    const agentRoles = diagramData.agents.filter(agent => 
      AGENT_TYPES.includes(agent.type as typeof AGENT_TYPES[number])
    );
    
    // 2. Use common mapper: expands roles AND maps to CommonAgent
    const agents: CommonAgent[] = mapAgentRolesToCommon(agentRoles, this.options);
    
    // 3. Use common mapper: generates CommonTask for each agent
    const tasks: CommonTask[] = generateTasksForAgents(agents);
    
    // 4. Determine process type from relationships
    const processType = determineProcessType(diagramData, this.options);
    
    // 5. Find manager if hierarchical
    const managerAgent = processType === 'hierarchical' 
      ? agents.find(a => a.role.toLowerCase().includes('supervisor'))?.variableName
      : undefined;
    
    // 6. Build CommonSwarm (framework-agnostic representation)
    const commonSwarm: CommonSwarm = {
      name: diagramName,
      framework: this.framework,
      agents,
      tasks,
      processType,
      managerAgent
    };
    
    // 7. Generate files (converts to CrewAI types internally for templates)
    const files = this.buildFiles(commonSwarm, diagramName, timestamp);
    
    return {
      files,
      diagramName,
      timestamp,
      agentCount: agents.length,
      taskCount: tasks.length
    };
  }
  
  protected buildFiles(swarm: CommonSwarm, diagramName: string, timestamp: string): GeneratedFile[] {
    // Convert CommonSwarm to CrewAICrew for template compatibility
    const crew: CrewAICrew = this.toCrewAICrew(swarm);
    
    return [
      {
        filename: 'main.py',
        content: generateMainPy(crew, diagramName, timestamp),
        type: 'python'
      },
      {
        filename: 'requirements.txt',
        content: generateRequirementsTxt(),
        type: 'txt'
      },
      {
        filename: 'README.md',
        content: generateReadme(diagramName, crew.agents.length, crew.tasks.length),
        type: 'md'
      }
    ];
  }
  
  // ============================================================
  // CONVERSION HELPERS: Common → CrewAI (for templates)
  // ============================================================
  
  private toCrewAICrew(swarm: CommonSwarm): CrewAICrew {
    return {
      agents: swarm.agents.map(a => this.toCrewAIAgent(a)),
      tasks: swarm.tasks.map(t => this.toCrewAITask(t)),
      processType: swarm.processType === 'auto' ? 'sequential' : swarm.processType,
      managerAgent: swarm.managerAgent
    };
  }
  
  private toCrewAIAgent(agent: CommonAgent): CrewAIAgent {
    return {
      variableName: agent.variableName,
      role: agent.role,
      goal: agent.goal,
      backstory: agent.backstory,
      llm: agent.llm || this.options.defaultLLM,
      allowDelegation: agent.allowDelegation,
      verbose: this.options.verbose  // CrewAI-specific field added here
    };
  }
  
  private toCrewAITask(task: CommonTask): CrewAITask {
    return {
      variableName: task.variableName,
      description: task.description,
      expectedOutput: task.expectedOutput,
      agentVariableName: task.agentVariableName
    };
  }
}