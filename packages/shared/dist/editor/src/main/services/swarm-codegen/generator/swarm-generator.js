import { expandAgentRoles, mapAgentRoleToCrewAI, AGENT_TYPES } from '../mappers/role-mapper';
import { generateTaskForAgent } from '../mappers/task-mapper';
import { determineProcessType } from '../mappers/link-mapper';
import { generateMainPy } from '../templates/crew-templates';
import { generateRequirementsTxt, generateReadme } from '../templates/config-templates';
const DEFAULT_OPTIONS = {
    outputFormat: 'single-file',
    includeComments: true,
    defaultLLM: 'gpt-4o',
    verbose: true,
    processType: 'auto'
};
export class SwarmCodeGenerator {
    constructor(options = {}) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
    }
    generate(diagramData) {
        const timestamp = new Date().toISOString();
        // 1. Filter to only agent types (Solver, Dispatcher, Evaluator, Supervisor)
        //    This excludes LanguageModel, AgentGroup base class, etc.
        const agentRoles = diagramData.agents.filter(agent => AGENT_TYPES.includes(agent.type));
        // 2. Expand roles based on 'numAgents' attribute
        const expandedRoles = expandAgentRoles(agentRoles);
        // 3. Map each expanded role to CrewAIAgent
        const agents = expandedRoles.map(({ role, index }) => mapAgentRoleToCrewAI(role, index, this.options));
        // 4. Generate tasks for each agent
        const tasks = expandedRoles.map(({ role }, idx) => generateTaskForAgent(agents[idx], role.type));
        // 5. Determine process type
        const processType = determineProcessType(diagramData, this.options);
        // 6. Find manager if hierarchical (look for Supervisor type)
        const managerAgent = processType === 'hierarchical'
            ? agents.find(a => a.role.toLowerCase().includes('supervisor'))?.variableName
            : undefined;
        // 7. Build crew
        const crew = { agents, tasks, processType, managerAgent };
        // 8. Generate files
        const diagramName = diagramData.swarm.name || 'SwarmDiagram';
        const files = this.buildFiles(crew, diagramName, timestamp);
        return {
            files,
            diagramName,
            timestamp,
            agentCount: agents.length,
            taskCount: tasks.length
        };
    }
    buildFiles(crew, diagramName, timestamp) {
        const files = [];
        // Main Python file
        files.push({
            filename: 'main.py',
            content: generateMainPy(crew, diagramName, timestamp),
            type: 'python'
        });
        // Requirements
        files.push({
            filename: 'requirements.txt',
            content: generateRequirementsTxt(),
            type: 'txt'
        });
        // README
        files.push({
            filename: 'README.md',
            content: generateReadme(diagramName, crew.agents.length, crew.tasks.length),
            type: 'md'
        });
        return files;
    }
}
//# sourceMappingURL=swarm-generator.js.map