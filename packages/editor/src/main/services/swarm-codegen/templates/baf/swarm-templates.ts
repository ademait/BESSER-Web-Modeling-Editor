import { CommonSwarm } from '../../types/common-types';
import { generateAllBAFAgents } from './agent-templates';

export function generateBAFMainPy(swarm: CommonSwarm, diagramName: string, timestamp: string): string {
  const agentVars = swarm.agents.map(a => a.variableName).join(', ');
  
  return `"""
BESSER Agentic Framework - ${diagramName}
Generated: ${timestamp}
Framework: BESSER-BAF

This file was auto-generated from a SwarmDiagram.
"""

from besser.bot.core.bot import Bot
from besser.bot.core.session import Session
# Note: Import paths may need adjustment based on BESSER-BAF version

# ============================================================
# AGENTS
# ============================================================

${generateAllBAFAgents(swarm.agents)}

# ============================================================
# SWARM CONFIGURATION
# ============================================================

def create_swarm():
    """Create and configure the swarm."""
    agents = [${agentVars}]
    
    # Configure swarm behavior
    swarm = Swarm(
        name="${swarm.name}",
        agents=agents,
        # Add BESSER-BAF specific configuration here
    )
    
    return swarm

# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":
    print("Starting ${diagramName} swarm...")
    swarm = create_swarm()
    
    # Example: Run the swarm with a sample task
    # result = swarm.run("Your task description here")
    # print(result)
    
    print("Swarm created successfully!")
    print(f"Agents: {len(swarm.agents)}")
`;
}