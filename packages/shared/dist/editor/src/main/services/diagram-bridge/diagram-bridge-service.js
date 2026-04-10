/**
 * Implementation of the diagram bridge service
 * This service acts as a bridge between different diagram types,
 * allowing object diagrams to access class diagram data
 */
export class DiagramBridgeService {
    constructor() {
        this.classDiagramData = null;
        this.STORAGE_KEY = 'besser-class-diagram-bridge-data';
    }
    /**
     * Get all classes that are related to the given class (excluding inheritance)
     */
    getRelatedClasses(classId) {
        const data = this.getClassDiagramData();
        if (!data) {
            return [];
        }
        // Only consider relationships that are not inheritance
        const relatedClassIds = new Set();
        Object.values(data.relationships || {}).forEach((rel) => {
            if (rel.type !== 'ClassInheritance' &&
                rel.source?.element &&
                rel.target?.element) {
                if (rel.source.element === classId) {
                    relatedClassIds.add(rel.target.element);
                }
                if (rel.target.element === classId) {
                    relatedClassIds.add(rel.source.element);
                }
            }
        });
        // For each related class, check for inheritance relationships where the related class is the parent (target)
        const additionalRelatedClassIds = new Set();
        relatedClassIds.forEach(relatedId => {
            Object.values(data.relationships || {}).forEach((rel) => {
                if (rel.type === 'ClassInheritance' &&
                    rel.target?.element === relatedId &&
                    rel.source?.element) {
                    additionalRelatedClassIds.add(rel.source.element);
                }
            });
        });
        additionalRelatedClassIds.forEach(id => relatedClassIds.add(id));
        // Check for inheritance relationships where classId is the source (child)
        Object.values(data.relationships || {}).forEach((rel) => {
            if (rel.type === 'ClassInheritance' && rel.source?.element === classId && rel.target?.element) {
                const inheritedRelated = this.getRelatedClasses(rel.target.element);
                inheritedRelated.forEach(cls => relatedClassIds.add(cls.id));
            }
        });
        // Map related class IDs to IClassInfo objects
        const allClasses = this.getAvailableClasses();
        return allClasses.filter(cls => relatedClassIds.has(cls.id));
    }
    /**
     * Parse attribute name to extract type (for legacy data format)
     * Legacy format: "+ attributeName: type" or "- attributeName: type"
     */
    parseAttributeType(name) {
        if (!name)
            return 'str';
        // Match pattern like "+ name: type" or "name: type"
        const typeMatch = name.match(/:\s*(\w+)\s*$/);
        if (typeMatch) {
            return typeMatch[1];
        }
        return 'str';
    }
    /**
     * Clean attribute name by removing visibility modifiers and type
     * Legacy format: "+ attributeName: type" -> "attributeName"
     */
    cleanAttributeName(name) {
        if (!name)
            return '';
        // Remove leading visibility modifiers (+, -, #, ~) and trailing type
        let cleaned = name.replace(/^[+\-#~]\s*/, '');
        // Remove trailing type (": type")
        cleaned = cleaned.replace(/:\s*\w+\s*$/, '');
        return cleaned.trim();
    }
    /**
     * Set class diagram data and persist it
     */
    setClassDiagramData(data) {
        this.classDiagramData = data;
        // Persist to localStorage as backup
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        }
        catch (error) {
            console.warn('Failed to persist class diagram data to localStorage:', error);
        }
    }
    /**
     * Get class diagram data with fallback to localStorage
     */
    getClassDiagramData() {
        // Try memory first
        if (this.classDiagramData) {
            return this.classDiagramData;
        }
        // Fallback to localStorage
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                this.classDiagramData = JSON.parse(stored);
                return this.classDiagramData;
            }
        }
        catch (error) {
            console.warn('Failed to load class diagram data from localStorage:', error);
        }
        return null;
    }
    /**
     * Extract available classes from the class diagram data
     */
    getAvailableClasses() {
        const data = this.getClassDiagramData();
        if (!data) {
            return [];
        }
        try {
            return Object.values(data.elements || {})
                .filter((element) => element.type === 'Class' || element.type === 'AbstractClass')
                .map((element) => {
                // Get all attributes including inherited ones
                const allAttributes = this.getAllAttributesWithInheritance(element.id, data);
                return {
                    id: element.id,
                    name: element.name,
                    icon: element.icon,
                    attributes: allAttributes
                };
            });
        }
        catch (error) {
            console.error('Error extracting classes from diagram data:', error);
            return [];
        }
    }
    /**
     * Get all attributes for a class including inherited attributes
     */
    getAllAttributesWithInheritance(classId, data) {
        const attributes = [];
        const visited = new Set();
        const collectAttributes = (currentClassId, isInherited = false) => {
            if (visited.has(currentClassId)) {
                return; // Prevent infinite loops in case of circular inheritance
            }
            visited.add(currentClassId);
            const currentClass = data.elements[currentClassId];
            if (!currentClass || (currentClass.type !== 'Class' && currentClass.type !== 'AbstractClass')) {
                return;
            }
            // Add direct attributes of this class
            const classAttributes = (currentClass.attributes || [])
                .map((attrId) => {
                const attribute = data.elements[attrId];
                if (attribute) {
                    // Check if we have new format (separate attributeType property)
                    // or legacy format (type embedded in name like "+ name: str")
                    const hasNewFormat = attribute.attributeType !== undefined;
                    return {
                        id: attrId,
                        name: hasNewFormat ? attribute.name : this.cleanAttributeName(attribute.name),
                        attributeType: hasNewFormat ? attribute.attributeType : this.parseAttributeType(attribute.name),
                        visibility: attribute.visibility || 'public',
                        sourceClass: currentClass.name,
                        isInherited: isInherited
                    };
                }
                return null;
            })
                .filter((attr) => attr !== null);
            // Add to beginning for proper inheritance order (parent first)
            attributes.unshift(...classAttributes);
            // Find parent classes through inheritance relationships
            // In inheritance: source = child class, target = parent class
            // So when we're looking for parents of currentClassId, we need to find relationships
            // where currentClassId is the SOURCE (child) and get the TARGET (parent)
            const inheritanceRelationships = Object.values(data.relationships || {})
                .filter((rel) => rel.type === 'ClassInheritance' &&
                rel.source?.element === currentClassId);
            // Recursively collect from parent classes (targets of inheritance relationships)
            inheritanceRelationships.forEach((rel) => {
                if (rel.target?.element) {
                    collectAttributes(rel.target.element, true);
                }
            });
        };
        collectAttributes(classId);
        // Remove duplicates and return clean attribute info
        const uniqueAttributes = new Map();
        attributes.forEach(attr => {
            if (!uniqueAttributes.has(attr.id)) {
                uniqueAttributes.set(attr.id, {
                    id: attr.id,
                    name: attr.name,
                    attributeType: attr.attributeType,
                    visibility: attr.visibility
                });
            }
        });
        return Array.from(uniqueAttributes.values());
    }
    /**
     * Get associations between two specific classes, including inherited associations
     */
    getAvailableAssociations(sourceClassId, targetClassId) {
        const data = this.getClassDiagramData();
        if (!data?.relationships) {
            return [];
        }
        try {
            // Get all possible class IDs including inheritance hierarchy
            const sourceClassIds = this.getAllClassesInHierarchy(sourceClassId);
            const targetClassIds = this.getAllClassesInHierarchy(targetClassId);
            const associations = [];
            const seenAssociationIds = new Set();
            // Check all combinations of source and target classes (including their hierarchies)
            sourceClassIds.forEach(srcId => {
                targetClassIds.forEach(tgtId => {
                    Object.values(data.relationships)
                        .filter((relationship) => {
                        // Only include association-type relationships (not inheritance)
                        const isAssociationType = relationship.type !== 'ClassInheritance' &&
                            relationship.type !== 'ClassRealization';
                        if (!isAssociationType)
                            return false;
                        // Check if relationship connects the classes (in either direction)
                        return ((relationship.source?.element === srcId && relationship.target?.element === tgtId) ||
                            (relationship.source?.element === tgtId && relationship.target?.element === srcId));
                    })
                        .forEach((relationship) => {
                        // Avoid duplicate associations
                        if (!seenAssociationIds.has(relationship.id)) {
                            seenAssociationIds.add(relationship.id);
                            associations.push({
                                id: relationship.id,
                                name: relationship.name,
                                source: {
                                    element: relationship.source?.element || '',
                                    role: relationship.source?.role,
                                    multiplicity: relationship.source?.multiplicity
                                },
                                target: {
                                    element: relationship.target?.element || '',
                                    role: relationship.target?.role,
                                    multiplicity: relationship.target?.multiplicity
                                }
                            });
                        }
                    });
                });
            });
            return associations;
        }
        catch (error) {
            console.error('Error extracting associations from diagram data:', error);
            return [];
        }
    }
    /**
     * Get all classes in the inheritance hierarchy for a given class (including the class itself)
     */
    getAllClassesInHierarchy(classId) {
        const data = this.getClassDiagramData();
        if (!data) {
            return [classId];
        }
        const allClasses = new Set();
        const visited = new Set();
        const collectHierarchy = (currentClassId) => {
            if (visited.has(currentClassId)) {
                return; // Prevent infinite loops
            }
            visited.add(currentClassId);
            const currentClass = data.elements[currentClassId];
            if (!currentClass || (currentClass.type !== 'Class' && currentClass.type !== 'AbstractClass')) {
                return;
            }
            allClasses.add(currentClassId);
            // Find parent classes through inheritance relationships
            // In inheritance: source = child class, target = parent class
            const inheritanceRelationships = Object.values(data.relationships || {})
                .filter((rel) => rel.type === 'ClassInheritance' &&
                rel.source?.element === currentClassId);
            inheritanceRelationships.forEach((rel) => {
                if (rel.target?.element) {
                    collectHierarchy(rel.target.element);
                }
            });
            // Also find child classes (classes that inherit from this one)
            const childInheritanceRelationships = Object.values(data.relationships || {})
                .filter((rel) => rel.type === 'ClassInheritance' &&
                rel.target?.element === currentClassId);
            childInheritanceRelationships.forEach((rel) => {
                if (rel.source?.element) {
                    collectHierarchy(rel.source.element);
                }
            });
        };
        collectHierarchy(classId);
        return Array.from(allClasses);
    }
    /**
     * Clear all stored diagram data
     */
    clearDiagramData() {
        this.classDiagramData = null;
        try {
            localStorage.removeItem(this.STORAGE_KEY);
        }
        catch (error) {
            console.warn('Failed to clear class diagram data from localStorage:', error);
        }
    }
    /**
     * Check if class diagram data is available
     */
    hasClassDiagramData() {
        return this.getClassDiagramData() !== null;
    }
    /**
     * Generate a display name for a relationship
     * Used when the relationship doesn't have an explicit name
     */
    getRelationshipDisplayName(relationship, sourceObjectName, targetObjectName) {
        // If the relationship has a name, use it
        if (relationship.name && relationship.name.trim()) {
            return relationship.name;
        }
        // Create a name from the association role names
        const sourceRole = relationship.source?.role;
        const targetRole = relationship.target?.role;
        const sourceMultiplicity = relationship.source?.multiplicity;
        const targetMultiplicity = relationship.target?.multiplicity;
        // If we have role names and they're not empty, use them
        if (sourceRole && targetRole && sourceRole.trim() && targetRole.trim()) {
            return `${sourceRole}-${targetRole}`;
        }
        // If we have multiplicities, use them as a fallback
        if (sourceMultiplicity && targetMultiplicity) {
            return `${sourceMultiplicity}-${targetMultiplicity}`;
        }
        // Fallback to object names if available
        if (sourceObjectName && targetObjectName) {
            return `${sourceObjectName}-${targetObjectName}`;
        }
        // Final fallback
        return `Association-${relationship.id.substring(0, 8)}`;
    }
    /**
     * Get class by ID for verification purposes
     */
    getClassById(classId) {
        const availableClasses = this.getAvailableClasses();
        return availableClasses.find(cls => cls.id === classId) || null;
    }
    /**
     * Get inheritance hierarchy for a class (for debugging/display purposes)
     */
    getClassHierarchy(classId) {
        const data = this.getClassDiagramData();
        if (!data) {
            return [];
        }
        const hierarchy = [];
        const visited = new Set();
        const collectHierarchy = (currentClassId) => {
            if (visited.has(currentClassId)) {
                return;
            }
            visited.add(currentClassId);
            const currentClass = data.elements[currentClassId];
            if (!currentClass || (currentClass.type !== 'Class' && currentClass.type !== 'AbstractClass')) {
                return;
            }
            hierarchy.push(currentClass.name);
            // Find parent classes through inheritance relationships
            // In inheritance: source = child class, target = parent class
            // So when we're looking for parents of currentClassId, we need to find relationships
            // where currentClassId is the SOURCE (child) and get the TARGET (parent)
            const inheritanceRelationships = Object.values(data.relationships || {})
                .filter((rel) => rel.type === 'ClassInheritance' &&
                rel.source?.element === currentClassId);
            inheritanceRelationships.forEach((rel) => {
                if (rel.target?.element) {
                    collectHierarchy(rel.target.element);
                }
            });
        };
        collectHierarchy(classId);
        return hierarchy;
    }
}
/**
 * Singleton instance of the diagram bridge service
 * This ensures all parts of the application use the same instance
 */
export const diagramBridge = new DiagramBridgeService();
//# sourceMappingURL=diagram-bridge-service.js.map