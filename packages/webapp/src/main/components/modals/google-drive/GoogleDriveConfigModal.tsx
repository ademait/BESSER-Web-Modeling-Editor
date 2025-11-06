import React, { useEffect, useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import { GoogleDriveConfig } from '../../../services/google-drive/GoogleDriveClient';

interface GoogleDriveConfigModalProps {
  isVisible: boolean;
  initialConfig: GoogleDriveConfig | null;
  onSave: (config: GoogleDriveConfig) => void;
  onClear: () => void;
  onClose: () => void;
}

export const GoogleDriveConfigModal: React.FC<GoogleDriveConfigModalProps> = ({
  isVisible,
  initialConfig,
  onSave,
  onClear,
  onClose,
}) => {
  const [clientId, setClientId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [folderId, setFolderId] = useState('');

  useEffect(() => {
    setClientId(initialConfig?.clientId ?? '');
    setApiKey(initialConfig?.apiKey ?? '');
    setFolderId(initialConfig?.defaultFolderId ?? '');
  }, [initialConfig, isVisible]);

  const handleSave = () => {
    onSave({
      clientId: clientId.trim(),
      apiKey: apiKey.trim(),
      defaultFolderId: folderId.trim() || undefined,
    });
  };

  const handleClear = () => {
    setClientId('');
    setApiKey('');
    setFolderId('');
    onClear();
  };

  const isValid = clientId.trim().length > 0 && apiKey.trim().length > 0;

  return (
    <Modal show={isVisible} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>Google Drive Connection</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="text-muted">
          Provide a Google OAuth 2.0 Client ID and API key with Drive API enabled. Credentials are stored locally in
          this browser.
        </p>
        <Form>
          <Form.Group className="mb-3" controlId="google-drive-client-id">
            <Form.Label>OAuth Client ID</Form.Label>
            <Form.Control
              type="text"
              placeholder="xxxxxxxxxx.apps.googleusercontent.com"
              value={clientId}
              onChange={(event) => setClientId(event.target.value)}
              autoComplete="off"
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="google-drive-api-key">
            <Form.Label>API Key</Form.Label>
            <Form.Control
              type="text"
              placeholder="AIza..."
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              autoComplete="off"
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="google-drive-folder-id">
            <Form.Label>Target Folder ID (optional)</Form.Label>
            <Form.Control
              type="text"
              placeholder="Google Drive folder ID for backups"
              value={folderId}
              onChange={(event) => setFolderId(event.target.value)}
              autoComplete="off"
            />
            <Form.Text>
              Leave empty to store files in the root of your drive or use the configured default folder.
            </Form.Text>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer className="justify-content-between">
        <Button variant="outline-danger" onClick={handleClear}>
          Clear
        </Button>
        <div>
          <Button variant="secondary" onClick={onClose} className="me-2">
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={!isValid}>
            Save
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};
