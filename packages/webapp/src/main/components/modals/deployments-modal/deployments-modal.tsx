import React, { useEffect, useState, useCallback } from 'react';
import { Modal, Button, Table, Badge, Spinner, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useDeployWebApp, DeploymentInfo } from '../../../services/generate-code/useDeployWebApp';
import { toast } from 'react-toastify';

interface DeploymentsModalProps {
  show: boolean;
  onHide: () => void;
}

export const DeploymentsModal: React.FC<DeploymentsModalProps> = ({ show, onHide }) => {
  const [deployments, setDeployments] = useState<DeploymentInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [stoppingId, setStoppingId] = useState<string | null>(null);

  const { listDeployments, stopDeployment, checkDeploymentHealth } = useDeployWebApp();

  const loadDeployments = useCallback(async () => {
    setLoading(true);
    try {
      const deps = await listDeployments();
      setDeployments(deps);
    } catch (error) {
      console.error('Failed to load deployments:', error);
      toast.error('Failed to load deployments');
    } finally {
      setLoading(false);
    }
  }, [listDeployments]);

  useEffect(() => {
    if (show) {
      loadDeployments();
    }
  }, [show, loadDeployments]);

  const handleStop = async (deploymentId: string) => {
    setStoppingId(deploymentId);
    try {
      const success = await stopDeployment(deploymentId);
      if (success) {
        // Remove from list
        setDeployments(prev => prev.filter(d => d.deployment_id !== deploymentId));
      }
    } finally {
      setStoppingId(null);
    }
  };

  const handleOpenUrl = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString();
    } catch {
      return isoString;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <Badge bg="success">Running</Badge>;
      case 'stopped':
        return <Badge bg="secondary">Stopped</Badge>;
      case 'error':
        return <Badge bg="danger">Error</Badge>;
      default:
        return <Badge bg="info">{status}</Badge>;
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-rocket-takeoff me-2"></i>
          Active Deployments
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
            <p className="mt-2">Loading deployments...</p>
          </div>
        ) : deployments.length === 0 ? (
          <div className="text-center py-4">
            <i className="bi bi-inbox fs-1 text-muted"></i>
            <p className="mt-2 text-muted">No active deployments</p>
            <p className="small text-muted">
              Deploy a web application from the GUI Editor to see it here.
            </p>
          </div>
        ) : (
          <Table responsive hover>
            <thead>
              <tr>
                <th>Project</th>
                <th>Status</th>
                <th>Started</th>
                <th>URLs</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {deployments.map((deployment) => (
                <tr key={deployment.deployment_id}>
                  <td>
                    <strong>{deployment.project_name}</strong>
                    <br />
                    <small className="text-muted">{deployment.deployment_id}</small>
                  </td>
                  <td>{getStatusBadge(deployment.status)}</td>
                  <td>
                    <small>{formatDate(deployment.started_at)}</small>
                  </td>
                  <td>
                    <div className="d-flex flex-column gap-1">
                      <OverlayTrigger
                        placement="top"
                        overlay={<Tooltip>Open Frontend</Tooltip>}
                      >
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 text-start"
                          onClick={() => handleOpenUrl(deployment.urls.frontend)}
                        >
                          <i className="bi bi-box-arrow-up-right me-1"></i>
                          Frontend (:{deployment.ports.frontend})
                        </Button>
                      </OverlayTrigger>
                      <OverlayTrigger
                        placement="top"
                        overlay={<Tooltip>Open API Documentation</Tooltip>}
                      >
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 text-start"
                          onClick={() => handleOpenUrl(deployment.urls.api_docs)}
                        >
                          <i className="bi bi-file-earmark-code me-1"></i>
                          API Docs (:{deployment.ports.backend})
                        </Button>
                      </OverlayTrigger>
                    </div>
                  </td>
                  <td>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleStop(deployment.deployment_id)}
                      disabled={stoppingId === deployment.deployment_id}
                    >
                      {stoppingId === deployment.deployment_id ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            className="me-1"
                          />
                          Stopping...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-stop-fill me-1"></i>
                          Stop
                        </>
                      )}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
        <Button variant="primary" onClick={loadDeployments} disabled={loading}>
          <i className="bi bi-arrow-clockwise me-1"></i>
          Refresh
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeploymentsModal;
