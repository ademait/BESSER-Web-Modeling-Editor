/**
 * Default settings configuration
 */
export const DEFAULT_SETTINGS = {
    showInstancedObjects: true, // Default to true to show instances
    showIconView: false, // Default to false to hide class icons
    showAssociationNames: false, // Default to false to hide association names
};
/**
 * Implementation of the settings service for standalone version
 */
export class SettingsService {
    constructor() {
        this.STORAGE_KEY = 'besser-standalone-settings';
        this.listeners = [];
        this.settings = this.loadSettings();
    }
    /**
     * Load settings from localStorage with fallback to defaults
     */
    loadSettings() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                const parsedSettings = JSON.parse(stored);
                // Merge with defaults to ensure all properties exist
                return { ...DEFAULT_SETTINGS, ...parsedSettings };
            }
        }
        catch (error) {
            console.warn('Failed to load settings from localStorage:', error);
        }
        return { ...DEFAULT_SETTINGS };
    }
    /**
     * Save settings to localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.settings));
        }
        catch (error) {
            console.warn('Failed to save settings to localStorage:', error);
        }
    }
    /**
     * Notify all listeners of settings changes
     */
    notifyListeners() {
        this.listeners.forEach(callback => {
            try {
                callback({ ...this.settings });
            }
            catch (error) {
                console.error('Error in settings change listener:', error);
            }
        });
    }
    /**
     * Get current settings (returns a copy to prevent external mutations)
     */
    getSettings() {
        return { ...this.settings };
    }
    /**
     * Update a specific setting
     */
    updateSetting(key, value) {
        if (this.settings[key] !== value) {
            this.settings[key] = value;
            this.saveSettings();
            this.notifyListeners();
        }
    }
    /**
     * Reset all settings to their default values
     */
    resetToDefaults() {
        this.settings = { ...DEFAULT_SETTINGS };
        this.saveSettings();
        this.notifyListeners();
    }
    /**
     * Subscribe to settings changes
     * Returns an unsubscribe function
     */
    onSettingsChange(callback) {
        this.listeners.push(callback);
        // Return unsubscribe function
        return () => {
            const index = this.listeners.indexOf(callback);
            if (index >= 0) {
                this.listeners.splice(index, 1);
            }
        };
    }
    /**
     * Get a specific setting value
     */
    getSetting(key) {
        return this.settings[key];
    }
    /**
     * Check if instances should be shown in object preview
     */
    shouldShowInstancedObjects() {
        return this.settings.showInstancedObjects;
    }
    /**
     * Check if icons should be shown in the diagram
     */
    shouldShowIconView() {
        return this.settings.showIconView;
    }
    /**
     * Check if association names should be shown in the diagram
     */
    shouldShowAssociationNames() {
        return this.settings.showAssociationNames;
    }
}
/**
 * Singleton instance of the settings service
 */
export const settingsService = new SettingsService();
//# sourceMappingURL=settings-service.js.map