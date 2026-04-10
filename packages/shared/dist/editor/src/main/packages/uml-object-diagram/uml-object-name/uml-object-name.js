import { ObjectElementType, ObjectRelationshipType } from '..';
import { UMLClassifier } from '../../common/uml-classifier/uml-classifier';
import { UMLClassifierAttribute } from '../../common/uml-classifier/uml-classifier-attribute';
import { UMLClassifierMethod } from '../../common/uml-classifier/uml-classifier-method';
import { Text } from '../../../utils/svg/text';
import { settingsService } from '../../../services/settings/settings-service';
import { GeneralRelationshipType } from '../../uml-relationship-type';
export class UMLObjectName extends UMLClassifier {
    constructor(values) {
        super(values);
        this.type = ObjectElementType.ObjectName;
        this.underline = true;
        if (values?.classId) {
            this.classId = values.classId;
        }
        if (values?.className) {
            this.className = values.className;
        }
        if (values?.icon) {
            this.icon = values.icon;
        }
    }
    serialize(children = []) {
        const iconChild = children.find(child => child.type === ObjectElementType.ObjectIcon);
        return {
            ...super.serialize(children),
            classId: this.classId,
            className: this.className,
            icon: iconChild ? iconChild.id : undefined,
        };
    }
    deserialize(values, children) {
        super.deserialize(values, children);
        if ('classId' in values && typeof values.classId === 'string') {
            this.classId = values.classId;
        }
        if ('className' in values && typeof values.className === 'string') {
            this.className = values.className;
        }
        if ('icon' in values && typeof values.icon === 'string') {
            this.icon = values.icon;
        }
    }
    reorderChildren(children) {
        const attributes = children.filter((x) => x.type === ObjectElementType.ObjectAttribute);
        const methods = children.filter((x) => x.type === ObjectElementType.ObjectMethod);
        return [...attributes.map((element) => element.id), ...methods.map((element) => element.id)];
    }
    static extractSvgSize(svgString) {
        if (!svgString || typeof svgString !== 'string' || svgString.trim() === '') {
            return { width: 50, height: 50 };
        }
        try {
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
            const svgElement = svgDoc.querySelector('svg');
            let width = 0, height = 0;
            if (svgElement) {
                const widthAttr = svgElement.getAttribute('width');
                const heightAttr = svgElement.getAttribute('height');
                if (widthAttr)
                    width = parseFloat(widthAttr);
                if (heightAttr)
                    height = parseFloat(heightAttr);
                if ((!width || !height) && svgElement.hasAttribute('viewBox')) {
                    const viewBox = svgElement.getAttribute('viewBox').split(' ');
                    if (viewBox.length === 4) {
                        width = width || parseFloat(viewBox[2]);
                        height = height || parseFloat(viewBox[3]);
                    }
                }
            }
            return {
                width: width || 50,
                height: height || 50,
            };
        }
        catch (error) {
            console.warn('Error parsing SVG:', error);
            return { width: 50, height: 50 };
        }
    }
    static setupIconBounds(icon, baseY, minWidth, minHeight) {
        icon.bounds.x = 0.5;
        icon.bounds.y = baseY + 0.5 + 5;
        let svgWidth = minWidth, svgHeight = minHeight;
        const iconContent = icon.icon;
        if (iconContent && typeof iconContent === 'string' && iconContent.trim() !== '') {
            const size = UMLObjectName.extractSvgSize(iconContent);
            svgWidth = size.width;
            svgHeight = size.height;
        }
        icon.bounds.width = svgWidth;
        icon.bounds.height = svgHeight;
        return { width: svgWidth, height: svgHeight };
    }
    static finalizeBounds(element, layer, icon, iconSize, y) {
        // Ensure minimum width/height and add padding
        // Calculate the width of the name + ": " + className text
        const text = element.name + (element.className ? ": " + element.className : "");
        const textWidth = Text.size(layer, text).width + 40; // add some padding
        element.bounds.width = Math.max(element.bounds.width, iconSize.width + 10, textWidth);
        element.bounds.height = y + iconSize.height + 10;
        if (icon) {
            icon.bounds.width = element.bounds.width;
        }
    }
    render(layer, children = []) {
        // Check if we should show icon view or normal view
        const shouldShowIconView = settingsService.shouldShowIconView();
        if (shouldShowIconView) {
            // Check if there's actually an ObjectIcon with content before using icon view
            const hasValidIcon = children.some((x) => x.type === ObjectElementType.ObjectIcon &&
                x.icon &&
                typeof x.icon === 'string' &&
                x.icon.trim() !== '');
            if (hasValidIcon) {
                return this.renderIconView(layer, children);
            }
            else {
                return this.renderNormalView(layer, children);
            }
        }
        else {
            return this.renderNormalView(layer, children);
        }
    }
    renderIconView(layer, children = []) {
        const attributes = children.filter((x) => x instanceof UMLClassifierAttribute);
        const methods = children.filter((x) => x instanceof UMLClassifierMethod);
        this.hasAttributes = attributes.length > 0;
        this.hasMethods = methods.length > 0;
        let y = this.headerHeight;
        this.bounds.height = y;
        const icon = children.find((x) => x.type === ObjectElementType.ObjectIcon);
        let iconSize = { width: 0, height: 0 };
        if (icon && icon.icon && typeof icon.icon === 'string' && icon.icon.trim() !== '') {
            // Only process the icon if it exists and has valid content
            try {
                iconSize = UMLObjectName.setupIconBounds(icon, this.bounds.height, 50, 50);
                UMLObjectName.finalizeBounds(this, layer, icon, iconSize, y);
            }
            catch (error) {
                // Fall back to text-only rendering if icon processing fails
                const text = this.name + (this.className ? ": " + this.className : "");
                const textWidth = Text.size(layer, text).width + 40;
                this.bounds.width = Math.max(this.bounds.width, textWidth, 50);
            }
        }
        else {
            // No icon exists or icon content is invalid - just render text
            const text = this.name + (this.className ? ": " + this.className : "");
            const textWidth = Text.size(layer, text).width + 40;
            this.bounds.width = Math.max(this.bounds.width, textWidth, 50);
        }
        // Only include icon in return if it exists and has valid content
        return (icon && icon.icon && typeof icon.icon === 'string' && icon.icon.trim() !== '')
            ? [this, icon]
            : [this];
    }
    renderNormalView(layer, children = []) {
        // Use the standard UMLClassifier render method for normal view
        return super.render(layer, children);
    }
    renderObject(layer, children = [], icon) {
        const attributes = children.filter((x) => x instanceof UMLClassifierAttribute);
        const methods = children.filter((x) => x instanceof UMLClassifierMethod);
        this.hasAttributes = attributes.length > 0;
        this.hasMethods = methods.length > 0;
        let y = this.headerHeight;
        this.bounds.height = y;
        let iconSize = { width: 0, height: 0 };
        if (icon) {
            iconSize = UMLObjectName.setupIconBounds(icon, this.bounds.height, 50, 50);
            UMLObjectName.finalizeBounds(this, layer, icon, iconSize, y);
        }
        return [this, ...attributes, ...methods, icon];
    }
}
UMLObjectName.supportedRelationships = [
    ObjectRelationshipType.ObjectLink,
    GeneralRelationshipType.Link,
];
//# sourceMappingURL=uml-object-name.js.map