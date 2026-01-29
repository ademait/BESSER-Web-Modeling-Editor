import { SwarmCodeGenerator } from './generator/swarm-generator';
import { SwarmDiagramData } from './mappers/link-mapper';
import { SwarmElementType, SwarmRelationshipType } from '../../packages/swarm-diagram';
import * as fs from 'fs';
import * as path from 'path';

// Load from saved diagram JSON file
function loadDiagramFromFile(filePath: string): SwarmDiagramData | null {
  try {
    const jsonContent = fs.readFileSync(filePath, 'utf-8');
    const diagram = JSON.parse(jsonContent);
    return extractSwarmData(diagram);
  } catch (error) {
    console.error('Failed to load diagram:', error);
    return null;
  }
}

// Extract from diagram JSON structure
// Handles both raw model format and exported project format
// in case of exported project, or internal model
function extractSwarmData(diagram: any): SwarmDiagramData {
  // Navigate to the correct path based on JSON structure
  // Exported project format: project.diagrams.SwarmDiagram.model.elements
  // Raw model format: elements (at root level)
  let elements: Record<string, any> = {};
  let relationships: Record<string, any> = {};
  
  if (diagram.project?.diagrams?.SwarmDiagram?.model) {
    // Exported project format (from "Export Project" in editor)
    const model = diagram.project.diagrams.SwarmDiagram.model;
    elements = model.elements || {};
    relationships = model.relationships || {};
  } else if (diagram.model?.elements) {
    // Direct diagram format
    elements = diagram.model.elements || {};
    relationships = diagram.model.relationships || {};
  } else {
    // Raw model format (elements at root)
    elements = diagram.elements || {};
    relationships = diagram.relationships || {};
  }
  
  // Find Swarm container
  const swarm = Object.values(elements).find(
    (el: any) => el.type === SwarmElementType.Swarm
  );
  
  // Find all agents
  const agentTypes = [
    SwarmElementType.Dispatcher,
    SwarmElementType.Solver,
    SwarmElementType.Evaluator,
    SwarmElementType.Supervisor,
  ];
  
  const agents = Object.values(elements).filter(
    (el: any) => agentTypes.includes(el.type)
  );
  
  // Find all relationships from the relationships object
  const relationshipTypes = [
    SwarmRelationshipType.DelegationLink,
    SwarmRelationshipType.SupervisionLink,
    SwarmRelationshipType.SwarmLink,
  ];
  
  const foundRelationships = Object.values(relationships).filter(
    (rel: any) => relationshipTypes.includes(rel.type)
  );
  
  return {
    swarm: swarm as any,
    agents: agents as any[],
    relationships: foundRelationships as any[],
  };
}

// Run test
async function main() {
  console.log('=== MOSAICO DIAGRAM TEST ===\n');
  
  // Try to load from file (adjust path as needed)
  const diagramPath = path.resolve(__dirname, '../../../../../../.adem/framework-landing/examples/mosaico-example.json');
  
  let diagramData: SwarmDiagramData | null = null;
  
  if (fs.existsSync(diagramPath)) {
    console.log(`Loading diagram from: ${diagramPath}`);
    diagramData = loadDiagramFromFile(diagramPath);
  } else {
    console.log('Diagram file not found. Using MOSAICO-like mock data...');
    
    // MOSAICO-like structure based on the paper:
    // - 1 Dispatcher (Task Router)
    // - 3 Solvers (Workers)
    // - 1 Evaluator (Quality Check)
    // - 1 Supervisor (Orchestrator)
    diagramData = {
      swarm: {
        name: 'MOSAICO_Swarm',
        framework: 'BESSER-BAF',
      } as any,
      agents: [
        { type: 'Dispatcher', name: 'TaskRouter', numAgents: 1 } as any,
        { type: 'Solver', name: 'Worker', numAgents: 3 } as any,
        { type: 'Evaluator', name: 'QualityChecker', numAgents: 1 } as any,
        { type: 'Supervisor', name: 'Orchestrator', numAgents: 1 } as any,
      ],
      relationships: [
        { type: 'SupervisionLink', name: 'oversees' } as any,
        { type: 'DelegationLink', name: 'delegates_to' } as any,
      ]
    };
  }
  
  if (!diagramData) {
    console.error('Failed to load diagram data');
    return;
  }
  
  // Generate code
  const generator = new SwarmCodeGenerator({
    defaultLLM: 'gpt-4o',
    verbose: true,
    processType: 'auto'
  });
  
  const result = generator.generate(diagramData);
  
  // Output results
  console.log('\n--- Generation Results ---');
  console.log(`Diagram: ${result.diagramName}`);
  console.log(`Agents: ${result.agentCount}`);
  console.log(`Tasks: ${result.taskCount}`);
  console.log(`Files: ${result.files.map(f => f.filename).join(', ')}`);
  
  // Save generated files to output directory
  const outputDir = path.resolve(__dirname, '../../../../../../.adem/framework-landing/examples/mosaico-crewai');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  for (const file of result.files) {
    const filePath = path.join(outputDir, file.filename);
    fs.writeFileSync(filePath, file.content);
    console.log(`Written: ${filePath}`);
  }
  
  console.log(`\n✅ Generated files saved to: ${outputDir}`);
  console.log('\nTo test the generated code, run:');
  console.log(`  cd ${outputDir}`);
  console.log('  pip install -r requirements.txt');
  console.log('  export OPENAI_API_KEY=your-key-here');
  console.log('  python main.py');
}

main().catch(console.error);