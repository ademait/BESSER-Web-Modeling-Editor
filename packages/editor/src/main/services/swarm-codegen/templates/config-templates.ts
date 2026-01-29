export function generateRequirementsTxt(): string {
  return `crewai>=1.9.0
crewai-tools>=0.2.0
python-dotenv>=1.0.0
`;
}

export function generateReadme(diagramName: string, agentCount: number, taskCount: number): string {
  return `# ${diagramName} - CrewAI Swarm

Generated from SwarmDiagram using BESSER Web Modeling Editor.

## Overview

- **Agents:** ${agentCount}
- **Tasks:** ${taskCount}

## Installation

\`\`\`bash
pip install -r requirements.txt
\`\`\`

## Configuration

Create a \`.env\` file with your API keys:

\`\`\`
OPENAI_API_KEY=your-api-key-here
\`\`\`

## Usage

\`\`\`bash
python main.py
\`\`\`

## Generated Files

- \`main.py\` - Main entry point with Crew configuration
- \`requirements.txt\` - Python dependencies
- \`README.md\` - This file
`;
}