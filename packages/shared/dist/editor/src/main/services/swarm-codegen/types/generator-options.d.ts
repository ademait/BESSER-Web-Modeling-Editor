export interface GeneratorOptions {
    outputFormat: 'single-file' | 'multi-file';
    includeComments: boolean;
    defaultLLM: string;
    verbose: boolean;
    processType: 'auto' | 'sequential' | 'hierarchical';
}
export interface GeneratedFile {
    filename: string;
    content: string;
    type: 'python' | 'yaml' | 'txt' | 'md';
}
export interface GeneratorResult {
    files: GeneratedFile[];
    diagramName: string;
    timestamp: string;
    agentCount: number;
    taskCount: number;
}
