import { useCallback } from 'react';
import { toast, Id } from 'react-toastify';
import { BACKEND_URL } from '../../constant';
import { ProjectStorageRepository } from '../storage/ProjectStorageRepository';
import React from 'react';

export interface DeploymentInfo {
  deployment_id: string;
  project_name: string;
  docker_project_name: string;
  ports: {
    frontend: number;
    backend: number;
    agent_ws?: number;
    agent_http?: number;
  };
  started_at: string;
  status: string;
  urls: {
    frontend: string;
    backend: string;
    api_docs: string;
    agent_ws?: string;
  };
}

export interface DeploymentResponse {
  success: boolean;
  message: string;
  deployment: DeploymentInfo;
}

export interface DeploymentListResponse {
  success: boolean;
  deployments: DeploymentInfo[];
}

export const useDeployWebApp = () => {
  /**
   * Deploy the current project as a web application.
   * The project must have both ClassDiagram and GUINoCodeDiagram.
   */
  const deployWebApp = useCallback(async (): Promise<DeploymentInfo | null> => {
    // Get the current project
    const currentProject = ProjectStorageRepository.getCurrentProject();

    if (!currentProject) {
      toast.error('No project available for deployment');
      return null;
    }

    // Check for required diagrams
    const classDiagram = currentProject.diagrams?.ClassDiagram;
    const guiDiagram = currentProject.diagrams?.GUINoCodeDiagram;

    if (!classDiagram) {
      toast.error('ClassDiagram is required for Web App deployment');
      return null;
    }

    if (!guiDiagram) {
      toast.error('GUINoCodeDiagram is required for Web App deployment');
      return null;
    }

    // Create a persistent loading toast
    const toastId = toast.loading(
      'Deploying web application... This may take a few minutes.',
      {
        position: 'top-center',
        autoClose: false,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: false,
        progress: undefined,
      }
    );

    try {
      const response = await fetch(`${BACKEND_URL}/deploy-web-app`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(currentProject),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Could not parse error response' }));
        console.error('Deployment failed:', response.status, errorData);

        toast.update(toastId, {
          render: errorData.detail || `Deployment failed: HTTP ${response.status}`,
          type: 'error',
          isLoading: false,
          autoClose: 5000,
        });
        return null;
      }

      const result: DeploymentResponse = await response.json();

      if (result.success && result.deployment) {
        const { deployment } = result;
        
        // Update toast with success and links
        toast.update(toastId, {
          render: React.createElement('div', null,
            React.createElement('p', { style: { fontWeight: 'bold', marginBottom: '8px' } }, 
              '🚀 Web App Deployed Successfully!'
            ),
            React.createElement('p', { style: { marginBottom: '4px' } },
              'Frontend: ',
              React.createElement('a', {
                href: deployment.urls.frontend,
                target: '_blank',
                rel: 'noopener noreferrer',
                style: { color: '#4caf50', textDecoration: 'underline' }
              }, deployment.urls.frontend)
            ),
            React.createElement('p', { style: { marginBottom: '4px' } },
              'API Docs: ',
              React.createElement('a', {
                href: deployment.urls.api_docs,
                target: '_blank',
                rel: 'noopener noreferrer',
                style: { color: '#2196f3', textDecoration: 'underline' }
              }, deployment.urls.api_docs)
            ),
            React.createElement('p', { style: { fontSize: '12px', color: '#888', marginTop: '8px' } },
              `Deployment ID: ${deployment.deployment_id}`
            )
          ),
          type: 'success',
          isLoading: false,
          autoClose: 15000,
        });

        return deployment;
      } else {
        toast.update(toastId, {
          render: result.message || 'Deployment failed',
          type: 'error',
          isLoading: false,
          autoClose: 5000,
        });
        return null;
      }
    } catch (error) {
      let errorMessage = 'Unknown error occurred during deployment';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.update(toastId, {
        render: errorMessage,
        type: 'error',
        isLoading: false,
        autoClose: 5000,
      });
      return null;
    }
  }, []);

  /**
   * Get list of active deployments.
   */
  const listDeployments = useCallback(async (): Promise<DeploymentInfo[]> => {
    try {
      const response = await fetch(`${BACKEND_URL}/deployments`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Failed to list deployments:', response.status);
        return [];
      }

      const result: DeploymentListResponse = await response.json();
      return result.deployments || [];
    } catch (error) {
      console.error('Error listing deployments:', error);
      return [];
    }
  }, []);

  /**
   * Stop a deployment by ID.
   */
  const stopDeployment = useCallback(async (deploymentId: string): Promise<boolean> => {
    const toastId = toast.loading('Stopping deployment...', {
      position: 'top-center',
    });

    try {
      const response = await fetch(`${BACKEND_URL}/deployments/${deploymentId}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to stop deployment' }));
        toast.update(toastId, {
          render: errorData.detail || 'Failed to stop deployment',
          type: 'error',
          isLoading: false,
          autoClose: 3000,
        });
        return false;
      }

      toast.update(toastId, {
        render: 'Deployment stopped successfully',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });
      return true;
    } catch (error) {
      toast.update(toastId, {
        render: 'Error stopping deployment',
        type: 'error',
        isLoading: false,
        autoClose: 3000,
      });
      return false;
    }
  }, []);

  /**
   * Check health of a deployment.
   */
  const checkDeploymentHealth = useCallback(async (deploymentId: string): Promise<any> => {
    try {
      const response = await fetch(`${BACKEND_URL}/deployments/${deploymentId}/health`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        return { status: 'error', message: 'Failed to check health' };
      }

      const result = await response.json();
      return result.health;
    } catch (error) {
      return { status: 'error', message: 'Network error' };
    }
  }, []);

  return {
    deployWebApp,
    listDeployments,
    stopDeployment,
    checkDeploymentHealth,
  };
};
