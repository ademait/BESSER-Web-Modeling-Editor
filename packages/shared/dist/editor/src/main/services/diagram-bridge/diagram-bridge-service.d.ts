/**
 * Interface for class diagram data structure
 */
export interface IClassDiagramData {
    elements: Record<string, any>;
    relationships: Record<string, any>;
}
/**
 * Interface for class information extracted from diagram data
 */
export interface IClassInfo {
    id: string;
    name: string;
    icon: string;
    attributes: IAttributeInfo[];
}
/**
 * Interface for attribute information
 */
export interface IAttributeInfo {
    id: string;
    name: string;
    attributeType?: string;
    visibility?: string;
}
/**
 * Interface for association information
 */
export interface IAssociationInfo {
    id: string;
    name?: string;
    source: {
        element: string;
        role?: string;
        multiplicity?: string;
    };
    target: {
        element: string;
        role?: string;
        multiplicity?: string;
    };
}
/**
 * Service interface for bridging diagram data between different diagram types
 */
export interface IDiagramBridgeService {
    /**
     * Get the currently stored class diagram data
     */
    getClassDiagramData(): IClassDiagramData | null;
    /**
     * Set class diagram data for other diagrams to consume
     */
    setClassDiagramData(data: IClassDiagramData): void;
    /**
     * Get available classes from the stored class diagram
     */
    getAvailableClasses(): IClassInfo[];
    /**
     * Get available associations between two specific classes
     */
    getAvailableAssociations(sourceClassId: string, targetClassId: string): IAssociationInfo[];
    /**
     * Clear all stored diagram data
     */
    clearDiagramData(): void;
    /**
     * Check if class diagram data is available
     */
    hasClassDiagramData(): boolean;
    /**
     * Get all classes that are related to the given class (excluding inheritance)
     */
    getRelatedClasses(classId: string): IClassInfo[];
}
/**
 * Implementation of the diagram bridge service
 * This service acts as a bridge between different diagram types,
 * allowing object diagrams to access class diagram data
 */
export declare class DiagramBridgeService implements IDiagramBridgeService {
    /**
     * Get all classes that are related to the given class (excluding inheritance)
     */
    getRelatedClasses(classId: string): IClassInfo[];
    private classDiagramData;
    private readonly STORAGE_KEY;
    /**
     * Parse attribute name to extract type (for legacy data format)
     * Legacy format: "+ attributeName: type" or "- attributeName: type"
     */
    private parseAttributeType;
    /**
     * Clean attribute name by removing visibility modifiers and type
     * Legacy format: "+ attributeName: type" -> "attributeName"
     */
    private cleanAttributeName;
    /**
     * Set class diagram data and persist it
     */
    setClassDiagramData(data: IClassDiagramData): void;
    /**
     * Get class diagram data with fallback to localStorage
     */
    getClassDiagramData(): IClassDiagramData | null;
    /**
     * Extract available classes from the class diagram data
     */
    getAvailableClasses(): IClassInfo[];
    /**
     * Get all attributes for a class including inherited attributes
     */
    private getAllAttributesWithInheritance;
    /**
     * Get associations between two specific classes, including inherited associations
     */
    getAvailableAssociations(sourceClassId: string, targetClassId: string): IAssociationInfo[];
    /**
     * Get all classes in the inheritance hierarchy for a given class (including the class itself)
     */
    private getAllClassesInHierarchy;
    /**
     * Clear all stored diagram data
     */
    clearDiagramData(): void;
    /**
     * Check if class diagram data is available
     */
    hasClassDiagramData(): boolean;
    /**
     * Generate a display name for a relationship
     * Used when the relationship doesn't have an explicit name
     */
    getRelationshipDisplayName(relationship: IAssociationInfo, sourceObjectName?: string, targetObjectName?: string): string;
    /**
     * Get class by ID for verification purposes
     */
    getClassById(classId: string): IClassInfo | null;
    /**
     * Get inheritance hierarchy for a class (for debugging/display purposes)
     */
    getClassHierarchy(classId: string): string[];
}
/**
 * Singleton instance of the diagram bridge service
 * This ensures all parts of the application use the same instance
 */
export declare const diagramBridge: DiagramBridgeService;
