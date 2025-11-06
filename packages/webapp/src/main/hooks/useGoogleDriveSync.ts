import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import {
  GoogleDriveConfig,
  GoogleDriveFileSummary,
  GoogleDriveShareInfo,
  GoogleDriveUserProfile,
  createPublicShareLink,
  downloadFile,
  getCurrentUser,
  initializeGoogleDrive,
  isSignedIn,
  listJsonFiles,
  signIn,
  signOut,
  uploadJsonFile,
} from '../services/google-drive/GoogleDriveClient';
import { GOOGLE_DRIVE_API_KEY, GOOGLE_DRIVE_CLIENT_ID, GOOGLE_DRIVE_FOLDER_ID } from '../constant';
import { BesserProject } from '../types/project';
import { importProjectFromJson } from '../services/import/useImportProject';

type InitializationState = 'idle' | 'loading' | 'ready' | 'error' | 'unconfigured';

interface DriveActionState {
  action: 'connect' | 'upload' | 'list' | 'download' | 'share' | null;
  loading: boolean;
  message?: string;
}

interface DriveImportResult {
  projectId: string;
  file: GoogleDriveFileSummary;
}

interface UseGoogleDriveSync {
  isConfigured: boolean;
  initializationState: InitializationState;
  currentUser: GoogleDriveUserProfile | null;
  lastUploadedFile: GoogleDriveFileSummary | null;
  lastShareInfo: GoogleDriveShareInfo | null;
  driveError: string | null;
  actionState: DriveActionState;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshFiles: (options?: { folderId?: string; pageSize?: number }) => Promise<GoogleDriveFileSummary[]>;
  uploadProject: (project: BesserProject, options?: { folderId?: string }) => Promise<GoogleDriveFileSummary>;
  importProjectFromDrive: (file: GoogleDriveFileSummary) => Promise<DriveImportResult>;
  shareFile: (fileId: string) => Promise<GoogleDriveShareInfo>;
  resetError: () => void;
  updateConfig: (config: Partial<GoogleDriveConfig>) => void;
  config: GoogleDriveConfig | null;
  credentialsFromEnv: boolean;
}

function buildExportPayload(project: BesserProject): { filename: string; json: string } {
  // Generate a proper filename with timestamp if project name is empty or generic
  const projectName = project.name?.trim() || 'untitled_project';
  const safeName = projectName.replace(/[^a-z0-9_-]/gi, '_');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `${safeName}_${timestamp}.json`;
  
  const json = JSON.stringify(
    {
      project,
      exportedAt: new Date().toISOString(),
      version: '2.0.0',
    },
    null,
    2,
  );

  return {
    filename,
    json,
  };
}

export function useGoogleDriveSync(): UseGoogleDriveSync {
  const CONFIG_STORAGE_KEY = 'besser_google_drive_config_v1';

  const envProvided = useMemo(() => Boolean(GOOGLE_DRIVE_CLIENT_ID && GOOGLE_DRIVE_API_KEY), []);

  const [config, setConfig] = useState<GoogleDriveConfig | null>(() => {
    try {
      const cached = typeof window !== 'undefined' ? window.localStorage?.getItem(CONFIG_STORAGE_KEY) : null;
      if (cached && !envProvided) {
        const parsed = JSON.parse(cached) as GoogleDriveConfig;
        if (parsed.clientId && parsed.apiKey) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn('[GoogleDrive] Failed to restore config from storage:', error);
    }

    // Only use env credentials if they are properly set (not undefined or empty)
    if (
      GOOGLE_DRIVE_CLIENT_ID && 
      GOOGLE_DRIVE_API_KEY && 
      GOOGLE_DRIVE_CLIENT_ID.length > 10 && 
      GOOGLE_DRIVE_API_KEY.length > 10
    ) {
      return {
        clientId: GOOGLE_DRIVE_CLIENT_ID,
        apiKey: GOOGLE_DRIVE_API_KEY,
        defaultFolderId: GOOGLE_DRIVE_FOLDER_ID || undefined,
      };
    }

    return null;
  });

  const [initializationState, setInitializationState] = useState<InitializationState>(() =>
    config ? 'idle' : 'unconfigured',
  );
  const [currentUser, setCurrentUser] = useState<GoogleDriveUserProfile | null>(null);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [lastUploadedFile, setLastUploadedFile] = useState<GoogleDriveFileSummary | null>(null);
  const [lastShareInfo, setLastShareInfo] = useState<GoogleDriveShareInfo | null>(null);
  const [actionState, setActionState] = useState<DriveActionState>({ action: null, loading: false });
  const initializedRef = useRef(false);

  const isConfigured = useMemo(() => !!config, [config]);

  useEffect(() => {
    if (!config) {
      setInitializationState('unconfigured');
      return;
    }

    // Validate config before attempting initialization
    if (!config.apiKey || !config.clientId) {
      console.warn('[GoogleDrive] Configuration is incomplete. Please provide both apiKey and clientId.');
      setInitializationState('unconfigured');
      return;
    }

    // Skip initialization if credentials are obviously invalid (placeholder values)
    if (
      config.apiKey.length < 10 || 
      config.clientId.length < 10 ||
      config.apiKey === 'your-api-key' ||
      config.clientId === 'your-client-id'
    ) {
      console.warn('[GoogleDrive] Configuration appears to be placeholder values. Skipping initialization.');
      setInitializationState('unconfigured');
      return;
    }

    let cancelled = false;

    const bootstrap = async () => {
      if (initializedRef.current) {
        return;
      }

      setInitializationState('loading');
      try {
        await initializeGoogleDrive(config);
        if (cancelled) {
          return;
        }

        initializedRef.current = true;
        setInitializationState('ready');

        if (isSignedIn()) {
          setCurrentUser(getCurrentUser());
        }
      } catch (error) {
        if (cancelled) {
          return;
        }
        console.error('[GoogleDrive] Initialization failed:', error);
        setInitializationState('error');
        const errorMessage = error instanceof Error ? error.message : 'Failed to initialize Google Drive client.';
        setDriveError(errorMessage);
        
        // Show user-friendly error message
        if (errorMessage.includes('API key') || errorMessage.includes('discovery')) {
          console.error(
            '[GoogleDrive] Please ensure:\n' +
            '1. Your Google API key is valid\n' +
            '2. Google Drive API is enabled in your Google Cloud Console\n' +
            '3. API key restrictions allow your domain/localhost'
          );
        }
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [config]);

  const runAction = useCallback(
    async <T,>(action: DriveActionState['action'], handler: () => Promise<T>): Promise<T> => {
      setActionState({ action, loading: true });
      setDriveError(null);
      try {
        const result = await handler();
        setActionState({ action: null, loading: false });
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Google Drive operation failed.';
        console.error(`[GoogleDrive] ${action} failed:`, error);
        setDriveError(message);
        setActionState({ action: null, loading: false, message });
        toast.error(message);
        throw error;
      }
    },
    [],
  );

  const connect = useCallback(async () => {
    await runAction('connect', async () => {
      const profile = await signIn();
      setCurrentUser(profile);
    });
  }, [runAction]);

  const disconnect = useCallback(async () => {
    await runAction('connect', async () => {
      await signOut();
      setCurrentUser(null);
      setLastUploadedFile(null);
      setLastShareInfo(null);
    });
  }, [runAction]);

  const uploadProjectHandler = useCallback(
    async (project: BesserProject, options?: { folderId?: string }): Promise<GoogleDriveFileSummary> => {
      if (!project) {
        throw new Error('No project is available to upload.');
      }

      return runAction('upload', async () => {
        // console.log('[GoogleDrive] Uploading project:', {
        //   id: project.id,
        //   name: project.name,
        //   description: project.description,
        // });
        const exportPayload = buildExportPayload(project);
        console.log('[GoogleDrive] Generated filename:', exportPayload.filename);
        const file = await uploadJsonFile(exportPayload.filename, exportPayload.json, options);
        setLastUploadedFile(file);
        toast.success(`Saved "${file.name}" to Google Drive.`);
        return file;
      });
    },
    [runAction],
  );

  const refreshFiles = useCallback(
    async (options?: { folderId?: string; pageSize?: number }): Promise<GoogleDriveFileSummary[]> => {
      return runAction('list', async () => listJsonFiles(options));
    },
    [runAction],
  );

  const importProjectFromDriveHandler = useCallback(
    async (file: GoogleDriveFileSummary): Promise<DriveImportResult> => {
      return runAction('download', async () => {
        const content = await downloadFile(file.id);
        const blob = new Blob([content], { type: 'application/json' });
        const virtualFile = new File([blob], file.name, { type: 'application/json' });
        const project = await importProjectFromJson(virtualFile);
        toast.success(`Imported "${file.name}" from Google Drive.`);
        return { projectId: project.id, file };
      });
    },
    [runAction],
  );

  const shareFileHandler = useCallback(
    async (fileId: string): Promise<GoogleDriveShareInfo> => {
      return runAction('share', async () => {
        const shareInfo = await createPublicShareLink(fileId);
        setLastShareInfo(shareInfo);
        toast.success('Share link created. You can share it with anyone.');
        return shareInfo;
      });
    },
    [runAction],
  );

  const resetError = useCallback(() => {
    setDriveError(null);
    setActionState((state) => ({ ...state, message: undefined }));
  }, []);

  const updateConfig = useCallback(
    (partial: Partial<GoogleDriveConfig>) => {
      if (envProvided) {
        console.warn('[GoogleDrive] Ignoring config update because credentials come from environment variables.');
        return;
      }

      setConfig((prev) => {
        const next = { ...(prev || {}), ...partial } as GoogleDriveConfig;
        if (!next.clientId || !next.apiKey) {
          try {
            window.localStorage.removeItem(CONFIG_STORAGE_KEY);
          } catch (error) {
            console.warn('[GoogleDrive] Failed to clear stored config:', error);
          }
          initializedRef.current = false;
          setInitializationState('unconfigured');
          return null;
        }
        initializedRef.current = false;
        setInitializationState('idle');
        try {
          window.localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(next));
        } catch (error) {
          console.warn('[GoogleDrive] Failed to persist config:', error);
        }
        return next;
      });
    },
    [CONFIG_STORAGE_KEY, envProvided],
  );

  return {
    isConfigured,
    initializationState,
    currentUser,
    lastUploadedFile,
    lastShareInfo,
    driveError,
    actionState,
    connect,
    disconnect,
    refreshFiles,
    uploadProject: uploadProjectHandler,
    importProjectFromDrive: importProjectFromDriveHandler,
    shareFile: shareFileHandler,
    resetError,
    updateConfig,
    config,
    credentialsFromEnv: envProvided,
  };
}
