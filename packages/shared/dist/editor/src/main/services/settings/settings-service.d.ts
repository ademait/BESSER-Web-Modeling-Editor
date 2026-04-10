/**
 * Interface for application settings
 */
export interface IApplicationSettings {
    /** Whether to show instantiated class objects in object diagram preview */
    showInstancedObjects: boolean;
    /** Whether to show class icons in the diagram */
    showIconView: boolean;
    /** Whether to show association names in the diagram */
    showAssociationNames: boolean;
}
/**
 * Default settings configuration
 */
export declare const DEFAULT_SETTINGS: IApplicationSettings;
/**
 * Settings service interface
 */
export interface ISettingsService {
    /**
     * Get current settings
     */
    getSettings(): IApplicationSettings;
    /**
     * Update specific setting
     */
    updateSetting<K extends keyof IApplicationSettings>(key: K, value: IApplicationSettings[K]): void;
    /**
     * Reset to default settings
     */
    resetToDefaults(): void;
    /**
     * Subscribe to settings changes
     */
    onSettingsChange(callback: (settings: IApplicationSettings) => void): () => void;
}
/**
 * Implementation of the settings service for standalone version
 */
export declare class SettingsService implements ISettingsService {
    private settings;
    private readonly STORAGE_KEY;
    private listeners;
    constructor();
    /**
     * Load settings from localStorage with fallback to defaults
     */
    private loadSettings;
    /**
     * Save settings to localStorage
     */
    private saveSettings;
    /**
     * Notify all listeners of settings changes
     */
    private notifyListeners;
    /**
     * Get current settings (returns a copy to prevent external mutations)
     */
    getSettings(): IApplicationSettings;
    /**
     * Update a specific setting
     */
    updateSetting<K extends keyof IApplicationSettings>(key: K, value: IApplicationSettings[K]): void;
    /**
     * Reset all settings to their default values
     */
    resetToDefaults(): void;
    /**
     * Subscribe to settings changes
     * Returns an unsubscribe function
     */
    onSettingsChange(callback: (settings: IApplicationSettings) => void): () => void;
    /**
     * Get a specific setting value
     */
    getSetting<K extends keyof IApplicationSettings>(key: K): IApplicationSettings[K];
    /**
     * Check if instances should be shown in object preview
     */
    shouldShowInstancedObjects(): boolean;
    /**
     * Check if icons should be shown in the diagram
     */
    shouldShowIconView(): boolean;
    /**
     * Check if association names should be shown in the diagram
     */
    shouldShowAssociationNames(): boolean;
}
/**
 * Singleton instance of the settings service
 */
export declare const settingsService: SettingsService;
