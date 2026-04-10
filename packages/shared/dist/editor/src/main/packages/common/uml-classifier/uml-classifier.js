import { UMLContainer } from '../../../services/uml-container/uml-container';
import { assign } from '../../../utils/fx/assign';
import { Text } from '../../../utils/svg/text';
import { UMLClassifierAttribute } from './uml-classifier-attribute';
import { UMLClassifierMethod } from './uml-classifier-method';
import { UMLClassifierMember } from './uml-classifier-member';
export class UMLClassifier extends UMLContainer {
    get headerHeight() {
        return this.stereotype ? UMLClassifier.stereotypeHeaderHeight : UMLClassifier.nonStereotypeHeaderHeight;
    }
    constructor(values) {
        super();
        this.italic = false;
        this.underline = false;
        this.stereotype = null;
        this.deviderPosition = 0;
        this.hasAttributes = false;
        this.hasMethods = false;
        assign(this, values);
    }
    serialize(children = []) {
        return {
            ...super.serialize(children),
            type: this.type,
            attributes: children.filter((x) => x instanceof UMLClassifierAttribute).map((x) => x.id),
            methods: children.filter((x) => x instanceof UMLClassifierMethod).map((x) => x.id),
        };
    }
    render(layer, children = []) {
        const attributes = children.filter((x) => x instanceof UMLClassifierAttribute);
        const methods = children.filter((x) => x instanceof UMLClassifierMethod);
        this.hasAttributes = attributes.length > 0;
        this.hasMethods = methods.length > 0;
        const radix = 10;
        this.bounds.width = [this, ...attributes, ...methods].reduce((current, child, index) => {
            // For attributes/methods, use displayName to get the full formatted text (visibility + name + type)
            // For enumerations, only use the name
            const displayText = child instanceof UMLClassifierMember
                ? (this.stereotype === 'enumeration' ? child.name : child.displayName)
                : child.name;
            return Math.max(current, Math.round((Text.size(layer, displayText, index === 0 ? { fontWeight: 'bold' } : undefined).width + 20) / radix) * radix);
        }, Math.round(this.bounds.width / radix) * radix);
        if (this.className) {
            const text = this.name + (this.className ? ": " + this.className : "");
            const textWidth = Text.size(layer, text).width + 40; // add some padding
            this.bounds.width = Math.max(this.bounds.width, textWidth, 50);
        }
        let y = this.headerHeight;
        for (const attribute of attributes) {
            attribute.bounds.x = 0.5;
            attribute.bounds.y = y + 0.5;
            attribute.bounds.width = this.bounds.width - 1;
            y += attribute.bounds.height;
        }
        this.deviderPosition = y;
        for (const method of methods) {
            method.bounds.x = 0.5;
            method.bounds.y = y + 0.5;
            method.bounds.width = this.bounds.width - 1;
            y += method.bounds.height;
        }
        this.bounds.height = y;
        return [this, ...attributes, ...methods];
    }
}
UMLClassifier.features = {
    ...UMLContainer.features,
    droppable: false,
    resizable: 'WIDTH',
};
UMLClassifier.stereotypeHeaderHeight = 50;
UMLClassifier.nonStereotypeHeaderHeight = 40;
//# sourceMappingURL=uml-classifier.js.map