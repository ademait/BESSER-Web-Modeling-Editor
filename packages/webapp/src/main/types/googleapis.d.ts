declare global {
  interface GoogleTokenResponse {
    access_token: string;
    expires_in: string | number;
    scope: string;
    token_type: string;
  }

  interface GoogleTokenError {
    error: string;
    error_description?: string;
  }

  interface GoogleTokenClient {
    callback: (response: GoogleTokenResponse) => void;
    error_callback?: (error: GoogleTokenError) => void;
    requestAccessToken: (options?: { prompt?: string; scope?: string }) => void;
  }

  interface GoogleOAuth2 {
    initTokenClient(config: {
      client_id: string;
      scope: string;
      prompt?: string;
      callback: (response: GoogleTokenResponse) => void;
    }): GoogleTokenClient;
    revoke(token: string, completion: () => void): void;
  }

  interface Window {
    gapi?: any;
    google?: {
      accounts?: {
        oauth2?: GoogleOAuth2;
      };
    };
  }
}

export {};
