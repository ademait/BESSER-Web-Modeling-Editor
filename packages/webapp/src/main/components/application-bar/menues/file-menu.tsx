import React, { useContext, useState } from 'react';
import { useImportDiagramPictureFromImage } from '../../../services/import/useImportDiagramPicture';
import { NavDropdown, Modal, Spinner } from 'react-bootstrap';
import { ApollonEditorContext } from '../../apollon-editor-component/apollon-editor-context';
import { ModalContentType } from '../../modals/application-modal-types';

import { useAppDispatch, useAppSelector } from '../../store/hooks';

import { showModal } from '../../../services/modal/modalSlice';
import { useExportJSON } from '../../../services/export/useExportJson';
import { useExportPDF } from '../../../services/export/useExportPdf';
import { useExportPNG } from '../../../services/export/useExportPng';
import { useExportSVG } from '../../../services/export/useExportSvg';
import { useExportBUML } from '../../../services/export/useExportBuml';
import { toast } from 'react-toastify';
import { useImportDiagramToProjectWorkflow } from '../../../services/import/useImportDiagram';
import { useProject } from '../../../hooks/useProject';
import { JsonViewerModal } from '../../modals/json-viewer-modal/json-viewer-modal';
import { ProjectStorageRepository } from '../../../services/storage/ProjectStorageRepository';
import { useGoogleDriveSync } from '../../../hooks/useGoogleDriveSync';
import { GoogleDriveBrowserModal } from '../../modals/google-drive/GoogleDriveBrowserModal';
import { GoogleDriveConfigModal } from '../../modals/google-drive/GoogleDriveConfigModal';
import { GoogleDriveConfig, GoogleDriveFileSummary } from '../../../services/google-drive/GoogleDriveClient';

export const FileMenu: React.FC = () => {
  const apollonEditor = useContext(ApollonEditorContext);
  const dispatch = useAppDispatch();
  const editor = apollonEditor?.editor;
  const diagram = useAppSelector((state) => state.diagram.diagram);
  const { currentProject, loadProject } = useProject();
  const exportAsSVG = useExportSVG();
  const exportAsPNG = useExportPNG();
  const exportAsPDF = useExportPDF();
  const exportAsJSON = useExportJSON();
  const exportAsBUML = useExportBUML();
  const handleImportDiagramToProject = useImportDiagramToProjectWorkflow();
  const importDiagramPictureFromImage = useImportDiagramPictureFromImage();
  const {
    isConfigured: driveConfigured,
    initializationState: driveInitState,
    currentUser: driveUser,
    lastUploadedFile: driveLastUploadedFile,
    lastShareInfo: driveLastShareInfo,
    driveError,
    actionState: driveActionState,
    connect: connectDrive,
    disconnect: disconnectDrive,
    refreshFiles: refreshDriveFiles,
    uploadProject: uploadProjectToDrive,
    importProjectFromDrive,
    shareFile: shareDriveFile,
    resetError: resetDriveError,
    updateConfig: updateDriveConfig,
    config: driveConfig,
    credentialsFromEnv: driveEnvProvided,
  } = useGoogleDriveSync();

  // Modal state for feedback and input
  const [showImportModal, setShowImportModal] = React.useState(false);
  const [apiKey, setApiKey] = React.useState('');
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [fileError, setFileError] = React.useState('');
  const [isImporting, setIsImporting] = React.useState(false);

  // JSON Viewer modal state
  const [showJsonViewer, setShowJsonViewer] = useState(false);
  const [jsonToView, setJsonToView] = useState('');
  const [jsonDiagramType, setJsonDiagramType] = useState('');
  const [driveFiles, setDriveFiles] = useState<GoogleDriveFileSummary[]>([]);
  const [showDriveBrowser, setShowDriveBrowser] = useState(false);
  const [showDriveConfigModal, setShowDriveConfigModal] = useState(false);
  const [isDriveListing, setIsDriveListing] = useState(false);

  const driveReady = driveInitState === 'ready';
  const driveConnected = !!driveUser;
  const driveBusy = driveActionState.loading;
  const driveConnecting = driveBusy && driveActionState.action === 'connect';
  const driveUploading = driveBusy && driveActionState.action === 'upload';
  const driveListingBusy = driveBusy && driveActionState.action === 'list';
  const driveSharing = driveBusy && driveActionState.action === 'share';
  const driveDownloading = driveBusy && driveActionState.action === 'download';
  const driveModalBusy = isDriveListing || driveListingBusy || driveSharing || driveDownloading;

  const exportDiagram = async (exportType: 'PNG' | 'PNG_WHITE' | 'SVG' | 'JSON' | 'PDF' | 'BUML'): Promise<void> => {
    if (!editor) {
      toast.error('No diagram available to export');
      return;
    }

    try {
      switch (exportType) {
        case 'SVG':
          await exportAsSVG(editor, diagram.title);
          break;
        case 'PNG_WHITE':
          await exportAsPNG(editor, diagram.title, true);
          break;
        case 'PNG':
          await exportAsPNG(editor, diagram.title, false);
          break;
        case 'PDF':
          await exportAsPDF(editor, diagram.title);
          break;
        case 'JSON':
          await exportAsJSON(editor, diagram);
          break;
        case 'BUML':
          await exportAsBUML(editor, diagram.title);
          break;
      }
    } catch (error) {
      console.error('Error in exportDiagram:', error);
      // toast.error('Export failed. Check console for details.');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to export as BUML: ${errorMessage}`);
    }
  };

  // Placeholder handlers for project actions
  const handleNewProject = () => dispatch(showModal({ type: ModalContentType.CreateProjectModal }));
  const handleImportProject = () => dispatch(showModal({ type: ModalContentType.ImportProjectModal }));
  // const handleLoadProject = () => {
  //   // Open the Home modal to let users select from existing projects
  //   if (onOpenHome) {
  //     onOpenHome();
  //   }
  // };
  const handleLoadTemplate = () => dispatch(showModal({ type: ModalContentType.CreateDiagramFromTemplateModal }));
  const handleExportProject = () => dispatch(showModal({ type: ModalContentType.ExportProjectModal }));

  // Handler for previewing project JSON
  const handlePreviewProjectJSON = async () => {
    if (!currentProject) {
      toast.error('No project is open. Please create or open a project first.');
      return;
    }

    try {
      // Force GrapesJS to save before previewing (if editor is active)
      const graphicalEditorContext = window as typeof window & {
        editor?: { store: (callback: (result: unknown) => void) => void };
      };
      const graphicalEditor = graphicalEditorContext.editor;
      if (graphicalEditor && currentProject.currentDiagramType === 'GUINoCodeDiagram') {
        
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('GrapesJS save timeout'));
          }, 5000);
          
          graphicalEditor.store((_result: unknown) => {
            clearTimeout(timeout);
            console.log('[Preview] GrapesJS save completed');
            setTimeout(() => resolve(), 300);
          });
        });
      }

      // Reload the project from storage to get the latest data
      const freshProject = ProjectStorageRepository.loadProject(currentProject.id);
      if (!freshProject) {
        toast.error('Failed to load project data');
        return;
      }

      // Format the JSON with the same structure as export (V2.0.0 format)
      const exportData = {
        project: freshProject,
        exportedAt: new Date().toISOString(),
        version: '2.0.0'
      };
      
      const jsonString = JSON.stringify(exportData, null, 2);
      setJsonToView(jsonString);
      setJsonDiagramType('Project (V2.0.0)');
      setShowJsonViewer(true);
    } catch (error) {
      console.error('Error previewing project JSON:', error);
      toast.error(`Failed to preview project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handler for copying JSON to clipboard
  const handleCopyJsonToClipboard = () => {
    navigator.clipboard.writeText(jsonToView)
      .then(() => toast.success('JSON copied to clipboard!'))
      .catch(() => toast.error('Failed to copy JSON to clipboard'));
  };

  // Handler for downloading JSON
  const handleDownloadJson = () => {
    if (!currentProject) return;
    
    const blob = new Blob([jsonToView], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentProject.name.replace(/\s+/g, '_')}_project.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Project JSON downloaded!');
  };

  const handleConfigureDrive = () => {
    if (driveEnvProvided) {
      toast.info('Google Drive credentials are managed by the deployment configuration.');
      return;
    }
    setShowDriveConfigModal(true);
  };

  const handleSaveDriveConfig = (config: GoogleDriveConfig) => {
    updateDriveConfig(config);
    setShowDriveConfigModal(false);
    toast.success('Google Drive settings updated.');
  };

  const handleClearDriveConfig = () => {
    if (driveEnvProvided) {
      toast.info('Google Drive credentials are configured by the deployment and cannot be cleared here.');
      return;
    }

    updateDriveConfig({ clientId: '', apiKey: '', defaultFolderId: undefined });
    setShowDriveConfigModal(false);
    toast.info('Google Drive settings cleared.');
  };

  const handleConnectDrive = async () => {
    if (!driveConfigured && !driveConfig) {
      toast.error('Please configure Google Drive credentials first.');
      setShowDriveConfigModal(true);
      return;
    }

    if (driveInitState === 'error') {
      toast.error('Google Drive initialization failed. Update your credentials and try again.');
      setShowDriveConfigModal(true);
      return;
    }

    if (!driveReady) {
      toast.info('Google Drive is still initializing. Please try again in a moment.');
      return;
    }

    try {
      await connectDrive();
      toast.success('Connected to Google Drive.');
    } catch (error) {
      console.error('Failed to connect Google Drive:', error);
    }
  };

  const handleDisconnectDrive = async () => {
    if (!driveConnected) {
      return;
    }

    try {
      await disconnectDrive();
      toast.info('Disconnected from Google Drive.');
    } catch (error) {
      console.error('Failed to disconnect Google Drive:', error);
    }
  };

  const loadDriveFiles = async () => {
    if (!driveConnected) {
      toast.error('Connect to Google Drive first.');
      return;
    }

    setIsDriveListing(true);
    try {
      const files = await refreshDriveFiles({ pageSize: 50 });
      setDriveFiles(files);
    } catch (error) {
      console.error('Failed to fetch Google Drive files:', error);
    } finally {
      setIsDriveListing(false);
    }
  };

  const handleOpenDriveBrowser = async () => {
    if (!driveConnected) {
      toast.error('Connect to Google Drive first.');
      return;
    }

    setShowDriveBrowser(true);
    await loadDriveFiles();
  };

  const handleCloseDriveBrowser = () => {
    setShowDriveBrowser(false);
    setIsDriveListing(false);
    resetDriveError();
  };

  const handleRefreshDriveBrowser = async () => {
    await loadDriveFiles();
  };

  const handleImportProjectFromDrive = async (file: GoogleDriveFileSummary) => {
    try {
      const result = await importProjectFromDrive(file);
      setShowDriveBrowser(false);
      await loadProject(result.projectId);
    } catch (error) {
      console.error('Failed to import project from Google Drive:', error);
    }
  };

  const handleUploadProjectToDrive = async () => {
    if (!currentProject) {
      toast.error('No project is open. Save a project first.');
      return;
    }

    if (!driveConnected) {
      toast.error('Connect to Google Drive first.');
      return;
    }

    try {
      await uploadProjectToDrive(currentProject);
    } catch (error) {
      console.error('Failed to upload project to Google Drive:', error);
    }
  };

  const handleShareLatestDriveFile = async () => {
    if (!driveLastUploadedFile) {
      toast.error('Save a project to Google Drive to generate a share link.');
      return;
    }

    try {
      const shareInfo = await shareDriveFile(driveLastUploadedFile.id);
      if (navigator?.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(shareInfo.shareLink);
          toast.info('Share link copied to clipboard.');
        } catch (copyError) {
          console.warn('Clipboard copy failed:', copyError);
        }
      }
    } catch (error) {
      console.error('Failed to create share link:', error);
    }
  };

  const handleShareFileFromBrowser = async (file: GoogleDriveFileSummary) => {
    try {
      const shareInfo = await shareDriveFile(file.id);
      if (navigator?.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(shareInfo.shareLink);
          toast.info('Share link copied to clipboard.');
        } catch (copyError) {
          console.warn('Clipboard copy failed:', copyError);
        }
      }
    } catch (error) {
      console.error('Failed to share Google Drive file:', error);
    }
  };

  const handleCopyLatestShareLink = async () => {
    if (!driveLastShareInfo?.shareLink) {
      toast.error('No share link available yet.');
      return;
    }

    if (navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(driveLastShareInfo.shareLink);
        toast.success('Latest share link copied to clipboard.');
        return;
      } catch (error) {
        console.warn('Clipboard write failed:', error);
      }
    }

    toast.info(`Share link: ${driveLastShareInfo.shareLink}`);
  };

  // Handler for importing single diagram to project
  const handleImportDiagramToCurrentProject = async () => {
    if (!currentProject) {
      toast.error('No project is open. Please create or open a project first.');
      return;
    }

    try {
      const result = await handleImportDiagramToProject();
      toast.success(result.message);
      toast.info(`Imported diagram type: ${result.diagramType}`);
    } catch (error) {
      // Error handling is already done in the workflow function
      console.error('Import failed:', error);
    }
  };

  // Handler for importing diagram picture to project, triggers modal popup
  const handleImportDiagramPictureToCurrentProject = React.useCallback(() => {
    setShowImportModal(true);
    setApiKey('');
    setSelectedFile(null);
    setFileError('');
  }, []);

  // File input change handler (PNG/JPEG only)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      const allowedTypes = ['image/png', 'image/jpeg'];
      if (!allowedTypes.includes(file.type)) {
        setFileError('Only PNG or JPEG files are allowed.');
        setSelectedFile(null);
      } else {
        setFileError('');
        setSelectedFile(file);
      }
    } else {
      setFileError('');
      setSelectedFile(null);
    }
  };

  // Handler for Import button in modal
  const handleImportDiagramPictureFromImage = async () => {
    if (!selectedFile || !apiKey || fileError) return;
    setIsImporting(true);
    try {
      const result = await importDiagramPictureFromImage(selectedFile, apiKey);
      toast.success(result.message);
      toast.info(`Imported diagram type: ${result.diagramType}`);
      setShowImportModal(false);
    } catch {
      setShowImportModal(false);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <NavDropdown id="file-menu-item" title="File" className="pt-0 pb-0">
        {/* New */}
        <NavDropdown.Item onClick={handleNewProject}>
          New Project
        </NavDropdown.Item>

        {/* Import */}
        <NavDropdown.Item onClick={handleImportProject}>
          Import Project
        </NavDropdown.Item>

        {/* Import Single Diagram to Project - only show when a project is active */}
        {currentProject && (
          <>
            {/* <NavDropdown.Divider /> */}
            <NavDropdown.Item 
              onClick={handleImportDiagramToCurrentProject}
              title="Import a single diagram JSON file and add it to the current project (useful for converting old diagrams)"
            >
              Import Single Diagram to Project
            </NavDropdown.Item>
          </>
        )}

        {/* Import Single Diagram from Image to Project - only show when a project is active */}
        {currentProject && (
          <>
            {/* <NavDropdown.Divider /> */}
            <NavDropdown.Item 
              onClick={handleImportDiagramPictureToCurrentProject}
              title="Import Class Diagram by uploading an image containing the diagram and add it to the current project"
            >
              Import Class Diagram from Image to Project
            </NavDropdown.Item>
          </>
        )}

        {/* Load */}
        {/* <NavDropdown.Item onClick={handleLoadProject}>
          Load Project
        </NavDropdown.Item> */}

        {/* <NavDropdown.Divider /> */}

        {/* Load Template */}
        <NavDropdown.Item onClick={handleLoadTemplate}>
          Load Template
        </NavDropdown.Item>

        {/* <NavDropdown.Divider /> */}

        {/* Export */}
        <NavDropdown.Item onClick={handleExportProject}>
          Export Project
        </NavDropdown.Item>

        {/* Preview Project JSON - only show when a project is active */}
        {currentProject && (
          <NavDropdown.Item onClick={handlePreviewProjectJSON}>
            Preview Project JSON
          </NavDropdown.Item>
        )}

        <NavDropdown.Divider />
        <NavDropdown.Header>Google Drive</NavDropdown.Header>
        {!driveEnvProvided && (
          <NavDropdown.Item onClick={handleConfigureDrive}>
            {driveConfigured ? 'Update Google Drive Settings' : 'Configure Google Drive'}
          </NavDropdown.Item>
        )}
        <NavDropdown.Item
          onClick={handleConnectDrive}
          disabled={!driveConfigured || driveConnected || driveConnecting || driveInitState === 'loading'}
        >
          {driveConnecting ? 'Connecting to Google Drive…' : 'Connect to Google Drive'}
        </NavDropdown.Item>
        <NavDropdown.Item
          onClick={handleDisconnectDrive}
          disabled={!driveConnected || driveConnecting}
        >
          Disconnect Google Drive
        </NavDropdown.Item>
        <NavDropdown.Item
          onClick={handleUploadProjectToDrive}
          disabled={!driveConnected || !currentProject || driveUploading}
          title={!driveConnected ? 'Connect to Google Drive first' : undefined}
        >
          {driveUploading ? 'Saving to Google Drive…' : 'Save Project to Google Drive'}
        </NavDropdown.Item>
        <NavDropdown.Item
          onClick={handleOpenDriveBrowser}
          disabled={!driveConnected || driveModalBusy}
        >
          {driveModalBusy ? 'Opening Google Drive…' : 'Open Google Drive Backups…'}
        </NavDropdown.Item>
        <NavDropdown.Item
          onClick={handleShareLatestDriveFile}
          disabled={!driveConnected || !driveLastUploadedFile || driveSharing}
        >
          {driveSharing ? 'Generating share link…' : 'Share Latest Drive Backup'}
        </NavDropdown.Item>
        {driveLastShareInfo?.shareLink && (
          <NavDropdown.Item onClick={handleCopyLatestShareLink}>
            Copy Latest Share Link
          </NavDropdown.Item>
        )}

      </NavDropdown>

      {/* Modal for API key and file upload */}
      <Modal show={showImportModal} onHide={() => setShowImportModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Import Class Diagram from Image</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {isImporting && (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 80 }}>
              <Spinner animation="border" role="status" aria-label="Importing...">
                <span className="visually-hidden">Importing...</span>
              </Spinner>
            </div>
          )}
          {!isImporting && (
            <>
              <p className="mb-3 text-muted">
                OpenAI's GPT will be used as a large language model (LLM) to automatically extract the class diagram from your uploaded image and import it into the modeling environment.
              </p>
              <form>
                <div className="mb-3">
                  <label htmlFor="openai-api-key" className="form-label">OpenAI API Key</label>
                  <input
                    type="text"
                    className="form-control"
                    id="openai-api-key"
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    placeholder="Enter your OpenAI API key"
                    autoComplete="off"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="diagram-image-file" className="form-label">Upload Diagram Image (PNG or JPEG)</label>
                  <input
                    type="file"
                    className="form-control"
                    id="diagram-image-file"
                    accept="image/png, image/jpeg"
                    onChange={handleFileChange}
                  />
                  {fileError && <div className="text-danger mt-1">{fileError}</div>}
                  {selectedFile && <div className="mt-1">Selected file: {selectedFile.name}</div>}
                </div>
              </form>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary" onClick={() => setShowImportModal(false)} disabled={isImporting}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            disabled={!apiKey || !selectedFile || !!fileError || isImporting}
            onClick={handleImportDiagramPictureFromImage}
          >
            {isImporting ? 'Importing...' : 'Import'}
          </button>
        </Modal.Footer>
      </Modal>

      {!driveEnvProvided && (
        <GoogleDriveConfigModal
          isVisible={showDriveConfigModal}
          initialConfig={driveConfig}
          onSave={handleSaveDriveConfig}
          onClear={handleClearDriveConfig}
          onClose={() => setShowDriveConfigModal(false)}
        />
      )}

      <GoogleDriveBrowserModal
        isVisible={showDriveBrowser}
        isLoading={driveModalBusy}
        files={driveFiles}
        currentUser={driveUser}
        lastShareLink={driveLastShareInfo?.shareLink ?? null}
        error={driveError}
        onClose={handleCloseDriveBrowser}
        onRefresh={handleRefreshDriveBrowser}
        onSelect={handleImportProjectFromDrive}
        onShare={driveConnected ? handleShareFileFromBrowser : undefined}
      />

      {/* JSON Viewer Modal */}
      <JsonViewerModal
        isVisible={showJsonViewer}
        jsonData={jsonToView}
        diagramType={jsonDiagramType}
        onClose={() => setShowJsonViewer(false)}
        onCopy={handleCopyJsonToClipboard}
        onDownload={handleDownloadJson}
      />
    </>
  );
};
