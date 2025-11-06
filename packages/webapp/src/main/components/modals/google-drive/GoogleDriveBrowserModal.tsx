import React from 'react';
import { Button, ListGroup, Modal, Spinner } from 'react-bootstrap';
import { GoogleDriveFileSummary, GoogleDriveUserProfile } from '../../../services/google-drive/GoogleDriveClient';

interface GoogleDriveBrowserModalProps {
  isVisible: boolean;
  isLoading: boolean;
  files: GoogleDriveFileSummary[];
  currentUser: GoogleDriveUserProfile | null;
  lastShareLink?: string | null;
  error?: string | null;
  onClose: () => void;
  onRefresh: () => void;
  onSelect: (file: GoogleDriveFileSummary) => void;
  onShare?: (file: GoogleDriveFileSummary) => void;
}

export const GoogleDriveBrowserModal: React.FC<GoogleDriveBrowserModalProps> = ({
  isVisible,
  isLoading,
  files,
  currentUser,
  lastShareLink,
  error,
  onClose,
  onRefresh,
  onSelect,
  onShare,
}) => {
  return (
    <Modal show={isVisible} onHide={onClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Google Drive Projects</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            {currentUser ? (
              <>
                <div className="fw-semibold">{currentUser.name}</div>
                <div className="text-muted small">{currentUser.email}</div>
              </>
            ) : (
              <div className="text-muted">Not connected. Please sign in to Google Drive.</div>
            )}
          </div>
          <Button variant="outline-primary" size="sm" onClick={onRefresh} disabled={isLoading || !currentUser}>
            {isLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Loading
              </>
            ) : (
              'Refresh'
            )}
          </Button>
        </div>

        {error && <div className="alert alert-danger py-2 px-3">{error}</div>}

        {lastShareLink && (
          <div className="alert alert-info py-2 px-3">
            Latest share link:{' '}
            <a href={lastShareLink} target="_blank" rel="noopener noreferrer">
              {lastShareLink}
            </a>
          </div>
        )}

        {files.length === 0 && !isLoading && (
          <div className="text-muted">No Google Drive project backups found in the selected folder.</div>
        )}

        <ListGroup>
          {files.map((file) => (
            <ListGroup.Item
              key={file.id}
              className="d-flex justify-content-between align-items-center flex-column flex-md-row"
              action
            >
              <div className="me-3">
                <div className="fw-semibold">{file.name}</div>
                <div className="text-muted small">
                  Updated {new Date(file.modifiedTime).toLocaleString(undefined, { hour12: false })}
                </div>
              </div>
              <div className="d-flex gap-2 mt-2 mt-md-0">
                <Button variant="primary" size="sm" onClick={() => onSelect(file)} disabled={isLoading}>
                  Import
                </Button>
                {onShare && (
                  <Button variant="outline-secondary" size="sm" onClick={() => onShare(file)} disabled={isLoading}>
                    Share
                  </Button>
                )}
                {file.webViewLink && (
                  <Button
                    variant="outline-info"
                    size="sm"
                    href={file.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View
                  </Button>
                )}
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>

        {isLoading && (
          <div className="d-flex justify-content-center py-4">
            <Spinner animation="border" role="status" />
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
