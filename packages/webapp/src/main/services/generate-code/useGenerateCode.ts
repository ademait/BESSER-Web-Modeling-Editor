import { useCallback } from 'react';
import { ApollonEditor } from '@besser/wme';
import { useFileDownload } from '../file-download/useFileDownload';
import { toast } from 'react-toastify';
import { validateDiagram } from '../validation/validateDiagram';
import { BACKEND_URL } from '../../constant';
import { AgentConfigurationPayload } from '../../types/agent-config';

export interface AgentConfigurationSelection {
  name: string;
  configuration: AgentConfigurationPayload;
}
import { ProjectStorageRepository } from '../storage/ProjectStorageRepository';
import { isGrapesJSProjectData } from '../../types/project';
import { exportSwarmCode } from '@besser/wme';
import { createSwarmZip } from '../file-download/swarm-export-service';

// Add type definitions
export interface DjangoConfig {
  project_name: string;
  app_name: string;
  containerization: boolean;
}

export interface SQLConfig {
  dialect: 'sqlite' | 'postgresql' | 'mysql' | 'mssql' | 'mariadb' | 'oracle';
}

export interface SQLAlchemyConfig {
  dbms: 'sqlite' | 'postgresql' | 'mysql' | 'mssql' | 'mariadb' | 'oracle';
}

export interface JSONSchemaConfig {
  mode: 'regular' | 'smart_data';
}

export interface QiskitConfig {
  backend: 'aer_simulator' | 'fake_backend' | 'ibm_quantum';
  shots: number;
}

export interface AgentConfig {
  languages?: {
    source: string;
    target: string[];
  };
  configurations?: AgentConfigurationSelection[];
}

export interface CrewAIConfig {
  defaultLLM?: string;
  processType?: 'auto' | 'sequential' | 'hierarchical';
}

export type GeneratorConfig = {
  django: DjangoConfig;
  sql: SQLConfig;
  sqlalchemy: SQLAlchemyConfig;
  jsonschema: JSONSchemaConfig;
  qiskit: QiskitConfig;
  agent: AgentConfig;
  [key: string]: any;
};

export const useGenerateCode = () => {
  const downloadFile = useFileDownload();

  const generateCode = useCallback(
    async (editor: ApollonEditor | null, generatorType: string, diagramTitle: string, config?: GeneratorConfig[keyof GeneratorConfig]) => {
      console.log('Starting code generation...');

      // For Web App generator, send the entire project (doesn't need editor)
      if (generatorType === 'web_app') {
        return await generateCodeFromProject(generatorType, config);
      }

      // For Qiskit generator, it uses project data not editor
      if (generatorType === 'qiskit') {
        return await generateCodeFromProject(generatorType, config);
      }

      // For other generators, we need the editor and model
      if (!editor || !editor.model) {
        console.error('No editor or model available');
        toast.error('No diagram to generate code from');
        return;
      }

      // SwarmDiagram generator
      if (generatorType === 'swarm') {
        // Client-side generation for SwarmDiagram
        return await generateSwarmCode(editor, diagramTitle);
      }

      // Validate diagram before generation
      const validationResult = await validateDiagram(editor, diagramTitle);
      if (!validationResult.isValid) {
        toast.error(validationResult.message || 'Validation failed');
        return;
      }

      // Prepare body for single diagram generation
      const body: any = {
        title: diagramTitle,
        model: editor.model,
        generator: generatorType,
        config: config
      };

      try {
        const response = await fetch(`${BACKEND_URL}/generate-output`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/plain, */*',
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(e => ({ detail: 'Could not parse error response' }));
          console.error('Response not OK:', response.status, errorData); // Debug log

          if (response.status === 400 && errorData.detail) {
            toast.error(`${errorData.detail}`);
            return;
          }


          if (response.status === 500 && errorData.detail) {
            toast.error(`${errorData.detail}`);
            return;
          }

          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();

        // Get the filename from the response headers
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'generated_code.txt'; // Default filename

        if (contentDisposition) {
          // Try multiple patterns to extract filename
          const patterns = [
            /filename="([^"]+)"/,
            /filename=([^;\s]+)/,
            /filename="?([^";\s]+)"?/
          ];

          for (const pattern of patterns) {
            const match = contentDisposition.match(pattern);
            if (match) {
              filename = match[1];
              break;
            }
          }
        }

        downloadFile({ file: blob, filename });
        toast.success('Code generation completed successfully');
      } catch (error) {

        let errorMessage = 'Unknown error occurred';
        if (error instanceof Error) {
          errorMessage = error.message;
        }

        toast.error(`${errorMessage}`);
      }
    },
    [downloadFile],
  );

  const generateCodeFromProject = useCallback(
    async (generatorType: string, config?: GeneratorConfig[keyof GeneratorConfig]) => {
      console.log('Starting code generation from project...');

      // Get the current project
      const currentProject = ProjectStorageRepository.getCurrentProject();

      if (!currentProject) {
        toast.error('No project available for code generation');
        return;
      }

      // Add generator and config to project settings
      const projectWithSettings = {
        ...currentProject,
        settings: {
          ...currentProject.settings,
          generator: generatorType,
          config: config
        }
      };

      try {
        const response = await fetch(`${BACKEND_URL}/generate-output-from-project`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/plain, */*',
          },
          body: JSON.stringify(projectWithSettings),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(e => ({ detail: 'Could not parse error response' }));
          console.error('Response not OK:', response.status, errorData);

          if (response.status === 400 && errorData.detail) {
            toast.error(`${errorData.detail}`);
            return;
          }

          if (response.status === 500 && errorData.detail) {
            toast.error(`${errorData.detail}`);
            return;
          }

          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();

        // Get the filename from the response headers
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'generated_code.txt'; // Default filename

        if (contentDisposition) {
          const patterns = [
            /filename="([^"]+)"/,
            /filename=([^;\s]+)/,
            /filename="?([^";\s]+)"?/
          ];

          for (const pattern of patterns) {
            const match = contentDisposition.match(pattern);
            if (match) {
              filename = match[1];
              break;
            }
          }
        }

        downloadFile({ file: blob, filename });
        toast.success('Code generation completed successfully');
      } catch (error) {
        let errorMessage = 'Unknown error occurred';
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        toast.error(`${errorMessage}`);
      }
    },
    [downloadFile],
  );

  async function generateSwarmCode(editor: ApollonEditor, diagramTitle: string) {
    const model = editor.model;
    const elements = model.elements || {};
    const relationships = model.relationships || {};
    
    // Extract swarm element and read framework property
    const swarm = Object.values(elements).find((el: any) => el.type === 'Swarm');
    const agentTypes = ['Dispatcher', 'Solver', 'Evaluator', 'Supervisor'];
    const agents = Object.values(elements).filter((el: any) => agentTypes.includes(el.type));
    const links = Object.values(relationships);
    
    if (!swarm) {
      toast.error('No Swarm container found in diagram');
      return;
    }
    
    if (agents.length === 0) {
      toast.error('No agents found in diagram');
      return;
    }
    
    // Read framework from swarm element
    const framework = (swarm as any).framework || 'BESSER-BAF';
    const diagramData = { swarm, agents, relationships: links };
    
    try {
      // Call framework-agnostic export function
      const result = await exportSwarmCode(diagramData as any, framework);
      const blob = await createSwarmZip(result);
      downloadFile({ file: blob, filename: `${result.diagramName.replace(/\s+/g, '_')}_${framework.toLowerCase().replace('-', '_')}.zip` });
      toast.success(`Generated ${framework}: ${result.agentCount} agents, ${result.taskCount} tasks`);
    } catch (error) {
      console.error(`${framework} generation failed:`, error);
      toast.error(`${framework} generation failed. Check console for details.`);
    }
  }

  return generateCode;
};