import { GeneratorOptions, GeneratorResult } from './types/generator-options';
import { SwarmDiagramData } from './mappers/link-mapper';
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
export declare function exportSwarmAsCrewAI(diagramData: SwarmDiagramData, options?: SwarmExportOptions): Promise<GeneratorResult>;
/**
 * Helper to trigger file download from GeneratorResult
 */
export declare function downloadGeneratedFiles(result: GeneratorResult): void;
