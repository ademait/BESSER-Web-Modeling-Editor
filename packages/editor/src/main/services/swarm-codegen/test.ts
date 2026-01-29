import { SwarmCodeGenerator } from './generator/swarm-generator';
import { SwarmDiagramData } from './mappers/link-mapper';

// Mock data simulating a SwarmDiagram
const mockDiagramData: SwarmDiagramData = {
  swarm: {
    name: 'TestSwarm',
    framework: 'BESSER-BAF',
    // ... other required ISwarm properties
  } as any,
  agents: [
    { name: 'Dispatcher', type: 'Dispatcher', numAgents: 1 } as any,
    { name: 'Solver', type: 'Solver', numAgents: 3 } as any,
    { name: 'Evaluator', type: 'Evaluator', numAgents: 1 } as any,
  ],
  relationships: []
};

// Test the generator
const generator = new SwarmCodeGenerator({ defaultLLM: 'gpt-4o' });
const result = generator.generate(mockDiagramData);

console.log('Generated files:', result.files.map(f => f.filename));
console.log('Agent count:', result.agentCount);  // Should be 5 (1 + 3 + 1)
console.log('Task count:', result.taskCount);

// Print the main.py content
const mainPy = result.files.find(f => f.filename === 'main.py');
console.log('\n--- main.py ---\n');
console.log(mainPy?.content);