import { GeneratorOptions, GeneratorResult } from '../types/generator-options';
import { SwarmDiagramData } from '../mappers/link-mapper';
export declare class SwarmCodeGenerator {
    private options;
    constructor(options?: Partial<GeneratorOptions>);
    generate(diagramData: SwarmDiagramData): GeneratorResult;
    private buildFiles;
}
