export function generateBAFRequirements(): string {
  return `# BESSER Agentic Framework Dependencies
besser-bot>=2.0.0
# Add additional dependencies as needed
`;
}

export function generateBAFReadme(diagramName: string, agentCount: number, taskCount: number): string {
  return `# ${diagramName} - BESSER Agentic Framework

Auto-generated swarm from SwarmDiagram.

## Overview
- **Framework:** BESSER Agentic Framework (BAF)
- **Agents:** ${agentCount}
- **Tasks:** ${taskCount}

## Setup

1. Install dependencies:
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`

2. Run the swarm:
   \`\`\`bash
   python main.py
   \`\`\`

## Customization

Edit \`main.py\` to:
- Adjust agent configurations
- Define specific tasks
- Integrate with your application

## Documentation

- [BESSER Agentic Framework Docs](https://besser-pearl.github.io/BESSER-Bot-Framework/)
`;
}