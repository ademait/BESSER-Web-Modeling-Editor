import { GeneratorOptions, GeneratorResult, GeneratedFile } from '../types/generator-options';
import { CommonSwarm, SupportedFramework } from '../types/common-types';
import { SwarmDiagramData } from '../mappers/link-mapper';

export abstract class BaseSwarmGenerator {
  protected options: GeneratorOptions;
  abstract readonly framework: SupportedFramework;
  
  constructor(options: Partial<GeneratorOptions> = {}) {
    this.options = {
      outputFormat: 'single-file',
      includeComments: true,
      defaultLLM: 'gpt-4o',
      verbose: true,
      processType: 'auto',
      ...options
    };
  }
  
  abstract generate(diagramData: SwarmDiagramData): GeneratorResult;
  
  protected abstract buildFiles(swarm: CommonSwarm, diagramName: string, timestamp: string): GeneratedFile[];
}