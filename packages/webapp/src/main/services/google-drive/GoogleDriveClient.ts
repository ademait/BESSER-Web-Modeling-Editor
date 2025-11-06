import { GOOGLE_DRIVE_FOLDER_ID } from '../../constant';

type GapiEnabledWindow = Window &
  typeof globalThis & {
    gapi?: any;
    google?: {
      accounts?: {
        oauth2?: GoogleOAuth2;
      };
    };
  };

const getGapiWindow = (): GapiEnabledWindow => window as GapiEnabledWindow;

const GAPI_SOURCE = 'https://apis.google.com/js/api.js';
const GIS_SOURCE = 'https://accounts.google.com/gsi/client';
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
].join(' ');

export interface GoogleDriveConfig {
  apiKey: string;
  clientId: string;
  defaultFolderId?: string;
}

export interface GoogleDriveUserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface GoogleDriveFileSummary {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  webViewLink?: string;
}

export interface GoogleDriveShareInfo {
  file: GoogleDriveFileSummary;
  shareLink: string;
}

let gapiScriptPromise: Promise<void> | null = null;
let gisScriptPromise: Promise<void> | null = null;
let initPromise: Promise<void> | null = null;
let isInitialized = false;
let cachedConfig: GoogleDriveConfig | null = null;
let tokenClient: GoogleTokenClient | null = null;
let accessToken: string | null = null;
let tokenExpiry = 0;
let currentProfile: GoogleDriveUserProfile | null = null;
let googleOAuth2: GoogleOAuth2 | null = null;

function ensureGapiAvailable(): any {
  const { gapi } = getGapiWindow();
  if (!gapi) {
    throw new Error('Google API client library is not loaded.');
  }
  return gapi;
}

function loadGapiScript(): Promise<void> {
  if (gapiScriptPromise) {
    return gapiScriptPromise;
  }

  gapiScriptPromise = new Promise((resolve, reject) => {
    if (getGapiWindow().gapi) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = GAPI_SOURCE;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google API script.'));
    document.body.appendChild(script);
  });

  return gapiScriptPromise;
}

async function initGapi(config: GoogleDriveConfig): Promise<void> {
  const gapi = ensureGapiAvailable();

  await new Promise<void>((resolve, reject) => {
    try {
      gapi.load('client', {
        callback: resolve,
        onerror: () => reject(new Error('Failed to load Google API client modules.')),
      });
    } catch (error) {
      reject(error instanceof Error ? error : new Error('Unknown error during gapi load.'));
    }
  });

  try {
    await gapi.client.init({
      apiKey: config.apiKey,
      discoveryDocs: DISCOVERY_DOCS,
    });

    // Verify that the Drive API is available
    if (!gapi.client.drive) {
      console.error('[GoogleDrive] API discovery response:', gapi.client);
      throw new Error('Google Drive API is not available. Check your API key and ensure Drive API is enabled.');
    }
  } catch (error) {
    console.error('[GoogleDrive] API initialization error:', error);
    throw new Error(
      error instanceof Error 
        ? `Failed to initialize Google Drive API: ${error.message}` 
        : 'Failed to initialize Google Drive API'
    );
  }

  cachedConfig = config;
  isInitialized = true;
}

export async function initializeGoogleDrive(config: GoogleDriveConfig): Promise<void> {
  if (isInitialized) {
    return;
  }

  if (!config.apiKey || !config.clientId) {
    throw new Error('Google Drive API configuration is missing apiKey or clientId.');
  }

  const mergedConfig: GoogleDriveConfig = {
    ...config,
    defaultFolderId: config.defaultFolderId || GOOGLE_DRIVE_FOLDER_ID || undefined,
  };

  await loadGapiScript();
  await loadGisScript();

  if (!initPromise) {
    initPromise = (async () => {
      await initGapi(mergedConfig);
      const googleAccounts = getGapiWindow().google?.accounts?.oauth2;
      if (!googleAccounts) {
        throw new Error('Google Identity Services are unavailable.');
      }
      googleOAuth2 = googleAccounts;
      tokenClient = googleAccounts.initTokenClient({
        client_id: mergedConfig.clientId,
        scope: SCOPES,
        prompt: '',
        callback: () => {
          // Callback will be overridden before requesting tokens.
        },
      });
    })().catch((error) => {
      isInitialized = false;
      cachedConfig = null;
      initPromise = null;
      tokenClient = null;
      googleOAuth2 = null;
      throw error;
    });
  }

  await initPromise;
}

function isTokenValid(): boolean {
  return !!accessToken && Date.now() < tokenExpiry;
}

function handleTokenResponse(response: GoogleTokenResponse): string {
  if (!response || !response.access_token) {
    throw new Error('Google authorization did not return an access token.');
  }

  accessToken = response.access_token;
  const expiresIn =
    typeof response.expires_in === 'string' ? parseInt(response.expires_in, 10) : response.expires_in;
  const expiresInMs = Number.isFinite(expiresIn) ? (expiresIn as number) * 1000 : 0;
  tokenExpiry = Date.now() + Math.max(expiresInMs - 60_000, 0); // refresh 1 minute early

  try {
    const gapi = ensureGapiAvailable();
    gapi.client.setToken({ access_token: accessToken });
  } catch (error) {
    console.warn('[GoogleDrive] Failed to set gapi token:', error);
  }

  return accessToken;
}

async function requestAccessToken(forcePrompt: boolean): Promise<string> {
  if (!tokenClient || !googleOAuth2) {
    throw new Error('Google Drive authorization is not initialized.');
  }

  return new Promise<string>((resolve, reject) => {
    const client = tokenClient;
    if (!client) {
      reject(new Error('Google authorization client is unavailable.'));
      return;
    }

    client.callback = (response: GoogleTokenResponse) => {
      try {
        const token = handleTokenResponse(response);
        resolve(token);
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Failed to process Google authorization response.'));
      }
    };

    client.error_callback = (error: GoogleTokenError) => {
      const message = error?.error_description || error?.error || 'Google authorization failed.';
      reject(new Error(message));
    };

    try {
      client.requestAccessToken({
        prompt: forcePrompt ? 'consent' : '',
      });
    } catch (error) {
      reject(error instanceof Error ? error : new Error('Failed to request Google authorization.'));
    }
  });
}

async function ensureToken(forcePrompt = false): Promise<string> {
  if (isTokenValid() && accessToken) {
    try {
      const gapi = ensureGapiAvailable();
      gapi.client.setToken({ access_token: accessToken });
    } catch {
      // ignore
    }
    return accessToken;
  }

  const token = await requestAccessToken(forcePrompt);
  return token;
}

async function fetchUserProfile(token: string): Promise<GoogleDriveUserProfile> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to retrieve Google account information.');
  }

  const data = (await response.json()) as {
    id?: string;
    email?: string;
    name?: string;
    picture?: string;
  };

  return {
    id: data.id || data.email || '',
    name: data.name || data.email || 'Google Drive User',
    email: data.email || '',
    avatarUrl: data.picture,
  };
}

export function isSignedIn(): boolean {
  return isTokenValid();
}

export function getCurrentUser(): GoogleDriveUserProfile | null {
  return currentProfile;
}

export async function signIn(): Promise<GoogleDriveUserProfile> {
  const token = await ensureToken(true);
  try {
    currentProfile = await fetchUserProfile(token);
  } catch (error) {
    console.warn('[GoogleDrive] Failed to fetch user info:', error);
    currentProfile = {
      id: 'google-user',
      name: 'Google Drive User',
      email: '',
    };
  }
  return currentProfile;
}

export async function signOut(): Promise<void> {
  if (!accessToken) {
    currentProfile = null;
    return;
  }

  const oauth2 = googleOAuth2;
  await new Promise<void>((resolve) => {
    if (!oauth2) {
      resolve();
      return;
    }
    try {
      oauth2.revoke(accessToken as string, () => resolve());
    } catch (error) {
      console.warn('[GoogleDrive] Failed to revoke token:', error);
      resolve();
    }
  });

  accessToken = null;
  tokenExpiry = 0;
  currentProfile = null;

  try {
    const gapi = ensureGapiAvailable();
    gapi.client.setToken(null);
  } catch {
    // ignore
  }
}

export async function revokeAccess(): Promise<void> {
  await signOut();
}

function resolveFolderId(explicitFolderId?: string): string | undefined {
  return explicitFolderId || cachedConfig?.defaultFolderId || undefined;
}

export async function uploadJsonFile(
  filename: string,
  jsonPayload: string,
  options: { folderId?: string } = {},
): Promise<GoogleDriveFileSummary> {
  if (!isInitialized) {
    throw new Error('Google Drive client is not initialized.');
  }

  await ensureToken();
  const gapi = ensureGapiAvailable();
  const targetFolder = resolveFolderId(options.folderId);

  const metadata: Record<string, unknown> = {
    name: filename,
    mimeType: 'application/json',
  };

  if (targetFolder) {
    metadata.parents = [targetFolder];
  }

  // Create a multipart request body for proper file upload
  const boundary = '-------314159265358979323846';
  const delimiter = "\r\n--" + boundary + "\r\n";
  const close_delim = "\r\n--" + boundary + "--";

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    jsonPayload +
    close_delim;

  const response = await gapi.client.request({
    path: '/upload/drive/v3/files',
    method: 'POST',
    params: {
      uploadType: 'multipart',
      fields: 'id,name,mimeType,modifiedTime,webViewLink',
    },
    headers: {
      'Content-Type': 'multipart/related; boundary="' + boundary + '"',
    },
    body: multipartRequestBody,
  });

  console.log('[GoogleDrive] Upload response:', response.result);

  return response.result as GoogleDriveFileSummary;
}

export async function listJsonFiles(
  options: { folderId?: string; pageSize?: number } = {},
): Promise<GoogleDriveFileSummary[]> {
  if (!isInitialized) {
    throw new Error('Google Drive client is not initialized.');
  }

  await ensureToken();
  const gapi = ensureGapiAvailable();
  const targetFolder = resolveFolderId(options.folderId);

  const queryParts = ["mimeType = 'application/json'", 'trashed = false'];
  if (targetFolder) {
    queryParts.push(`'${targetFolder}' in parents`);
  }

  const response = await gapi.client.drive.files.list({
    q: queryParts.join(' and '),
    pageSize: options.pageSize ?? 20,
    fields: 'files(id,name,mimeType,modifiedTime,webViewLink)',
    orderBy: 'modifiedTime desc',
  });

  return (response.result?.files as GoogleDriveFileSummary[]) || [];
}

export async function downloadFile(fileId: string): Promise<string> {
  if (!isInitialized) {
    throw new Error('Google Drive client is not initialized.');
  }

  await ensureToken();
  const gapi = ensureGapiAvailable();
  const response = await gapi.client.drive.files.get({
    fileId,
    alt: 'media',
  });

  if (typeof response.body === 'string') {
    return response.body;
  }

  return JSON.stringify(response.result);
}

export async function createPublicShareLink(fileId: string): Promise<GoogleDriveShareInfo> {
  if (!isInitialized) {
    throw new Error('Google Drive client is not initialized.');
  }

  await ensureToken();
  const gapi = ensureGapiAvailable();

  // Ensure the file has a shareable link
  await gapi.client.drive.permissions.create({
    fileId,
    resource: {
      type: 'anyone',
      role: 'reader',
      allowFileDiscovery: false,
    },
  });

  const fileResponse = await gapi.client.drive.files.get({
    fileId,
    fields: 'id,name,mimeType,modifiedTime,webViewLink',
  });

  const file = fileResponse.result as GoogleDriveFileSummary;
  const shareLink = file.webViewLink ?? `https://drive.google.com/file/d/${file.id}/view`;

  return {
    file,
    shareLink,
  };
}
function loadGisScript(): Promise<void> {
  if (gisScriptPromise) {
    return gisScriptPromise;
  }

  gisScriptPromise = new Promise((resolve, reject) => {
    const existing = getGapiWindow().google?.accounts?.oauth2;
    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = GIS_SOURCE;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services script.'));
    document.body.appendChild(script);
  });

  return gisScriptPromise;
}
