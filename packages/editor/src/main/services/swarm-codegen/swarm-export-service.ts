import { SwarmCodeGenerator } from './generator/swarm-generator';
import { GeneratorOptions, GeneratorResult } from './types';
import { SwarmDiagramData } from './mappers/link-mapper';

// Configuration flag - set to true when backend is ready
const USE_BACKEND_GENERATION = false;
const BACKEND_URL = '';

export interface SwarmExportOptions extends Partial<GeneratorOptions> {
  downloadAsZip?: boolean;
}

/**
 * Main entry point for exporting SwarmDiagram as CrewAI code.
 * Abstracts whether generation happens client-side or via backend.
 * 
 * @param diagramData - The SwarmDiagramData containing swarm, agents, and relationships
 * @param options - Optional generator configuration
 */
export async function exportSwarmAsCrewAI(
  diagramData: SwarmDiagramData,
  options: SwarmExportOptions = {}
): Promise<GeneratorResult> {
  
  if (USE_BACKEND_GENERATION && BACKEND_URL) {
    // TODO: Future: Backend generation
    return await generateViaBackend(diagramData, options);
  }
  
  // MVP: Client-side generation
  return generateLocally(diagramData, options);
}

function generateLocally(diagramData: SwarmDiagramData, options: SwarmExportOptions): GeneratorResult {
  const generator = new SwarmCodeGenerator(options);
  return generator.generate(diagramData);
}

async function generateViaBackend(diagramData: SwarmDiagramData, options: SwarmExportOptions): Promise<GeneratorResult> {
  // TODO: Placeholder for future backend integration
  // Serialize the diagram data for transmission
  const response = await fetch(`${BACKEND_URL}/generate-swarm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      swarm: diagramData.swarm,
      agents: diagramData.agents.map(a => (a as any).serialize?.() || a),
      relationships: diagramData.relationships.map(r => (r as any).serialize?.() || r),
      options 
    })
  });
  
  if (!response.ok) {
    throw new Error(`Backend generation failed: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Helper to trigger file download from GeneratorResult. Used in
 * MVP. Not needed anymore.
 */
// export function downloadGeneratedFiles(result: GeneratorResult): void {
//   // For MVP: download main.py as single file
//   const mainFile = result.files.find(f => f.filename === 'main.py');
//   if (mainFile) {
//     const blob = new Blob([mainFile.content], { type: 'text/plain' });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = `${result.diagramName}_crewai.py`;
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
//     URL.revokeObjectURL(url);
//   }
// }

// For MVP creating minimal types to avoid full ApollonEditor import
interface MinimalApollonModel {
  model: {
    elements: Record<string, any>;
    relationships: Record<string, any>;
  };
}

export async function exportSwarmAsCrewAIFromEditor(editor: MinimalApollonModel): Promise<GeneratorResult> {
  // Extract elements/relationships from editor.model
  // Use mappers to convert to SwarmDiagramData
  // Call generator and return result

  // Extract diagram data from editor
  const model = editor.model;
  const elements = model.elements || {};
  const relationships = model.relationships || {};

  const swarm = Object.values(elements).find((el: any) => el.type === 'Swarm');
  const agentTypes = ['Dispatcher', 'Solver', 'Evaluator', 'Supervisor'];
  const agents = Object.values(elements).filter((el: any) => agentTypes.includes(el.type));
  const links = Object.values(relationships);

  if (!swarm) {
    throw new Error('No Swarm container found in diagram');
  }
  if (agents.length === 0) {
    throw new Error('No agents found in diagram');
  }

  // "mapper"
  const diagramData: SwarmDiagramData = {
    swarm: { ...swarm },
    agents: agents.map(a => ({ ...a })),
    relationships: links.map(l => ({ ...l })),
  };

  // Generate CrewAI code
  return await exportSwarmAsCrewAI(diagramData);
}