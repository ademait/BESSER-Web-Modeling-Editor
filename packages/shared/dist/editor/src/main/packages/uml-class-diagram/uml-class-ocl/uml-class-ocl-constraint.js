import { UMLElementType } from '../../uml-element-type';
import { ClassRelationshipType } from '..';
import { UMLElement } from '../../../services/uml-element/uml-element';
export class ClassOCLConstraint extends UMLElement {
    constructor(values) {
        super(values);
        this.type = UMLElementType.ClassOCLConstraint;
        this.constraint = '';
        if (values?.constraint !== undefined) {
            this.constraint = values.constraint;
        }
        this.adjustSizeToContent();
    }
    serialize() {
        return {
            ...super.serialize(),
            constraint: this.constraint
        };
    }
    deserialize(values) {
        super.deserialize(values);
        this.constraint = values.constraint || '';
    }
    wrapText(text, maxWidth) {
        if (!text)
            return [];
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        const charsPerLine = Math.floor((maxWidth - 40) / 8); // Account for padding
        for (const word of words) {
            if ((currentLine + ' ' + word).length <= charsPerLine) {
                currentLine = currentLine ? currentLine + ' ' + word : word;
            }
            else {
                if (currentLine)
                    lines.push(currentLine);
                if (word.length > charsPerLine) {
                    // Split long words
                    const chunks = word.match(new RegExp(`.{1,${charsPerLine}}`, 'g')) || [];
                    lines.push(...chunks.slice(0, -1));
                    currentLine = chunks[chunks.length - 1] || '';
                }
                else {
                    currentLine = word;
                }
            }
        }
        if (currentLine)
            lines.push(currentLine);
        return lines;
    }
    adjustSizeToContent() {
        // Ensure minimum dimensions
        this.bounds.width = Math.max(ClassOCLConstraint.MIN_WIDTH, this.bounds.width || ClassOCLConstraint.MIN_WIDTH);
        this.bounds.height = Math.max(ClassOCLConstraint.MIN_HEIGHT, this.bounds.height || ClassOCLConstraint.MIN_HEIGHT);
    }
    render(canvas) {
        return [this];
    }
}
// Define supported relationships - only OCL Link
ClassOCLConstraint.supportedRelationships = [
    ClassRelationshipType.ClassOCLLink
];
ClassOCLConstraint.MIN_WIDTH = 160;
ClassOCLConstraint.MIN_HEIGHT = 70;
ClassOCLConstraint.PADDING = 20;
//# sourceMappingURL=uml-class-ocl-constraint.js.map