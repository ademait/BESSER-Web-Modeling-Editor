import { GeneratorOptions, GeneratorResult, GeneratedFile } from '../types/generator-options';
import { CommonAgent, CommonTask, CommonSwarm, SupportedFramework } from '../types/common-types';
import { SwarmDiagramData } from '../mappers/link-mapper';
import { BaseSwarmGenerator } from './base-generator';
import { generateBAFMainPy, generateBAFRequirements, generateBAFReadme } from '../templates';
import { mapAgentRolesToCommon, AGENT_TYPES } from '../mappers/role-mapper';
import { generateTasksForAgents } from '../mappers/task-mapper';

export class BAFGenerator extends BaseSwarmGenerator {
  readonly framework: SupportedFramework = 'BESSER-BAF';
  
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
    
    // 4. Determine process type
    const processType = this.options.processType === 'auto' ? 'sequential' : this.options.processType;
    
    // 5. Find manager if hierarchical
    const managerAgent = processType === 'hierarchical' 
      ? agents.find(a => a.role.toLowerCase().includes('supervisor'))?.variableName
      : undefined;
    
    // 6. Build CommonSwarm
    const commonSwarm: CommonSwarm = {
      name: diagramName,
      framework: this.framework,
      agents,
      tasks,
      processType,
      managerAgent
    };
    
    // 7. Generate files
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
    return [
      { filename: 'main.py', content: generateBAFMainPy(swarm, diagramName, timestamp), type: 'python' },
      { filename: 'requirements.txt', content: generateBAFRequirements(), type: 'txt' },
      { filename: 'README.md', content: generateBAFReadme(diagramName, swarm.agents.length, swarm.tasks.length), type: 'md' }
    ];
  }
}