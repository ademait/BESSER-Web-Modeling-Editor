import { StateElementType, StateRelationshipType } from '..';
import { UMLElement } from '../../../services/uml-element/uml-element';
import { assign } from '../../../utils/fx/assign';
export class UMLStateCodeBlock extends UMLElement {
    constructor(values) {
        super(values);
        this.type = StateElementType.StateCodeBlock;
        this.code = '';
        this.language = 'python';
        this.bounds = {
            ...this.bounds,
            width: 200,
            height: 150
        };
        assign(this, values);
        if (values?.code) {
            this._codeContent = values.code;
            this.code = values.code;
        }
        this.language = 'python';
    }
    render(canvas) {
        // Enforce minimum dimensions for readability
        this.bounds.width = Math.max(this.bounds.width, 150);
        this.bounds.height = Math.max(this.bounds.height, 100);
        // Ensure code is sync'd with _codeContent
        if (this._codeContent && !this.code) {
            this.code = this._codeContent;
        }
        return [this];
    }
    serialize() {
        const base = super.serialize();
        // Use _codeContent if available, otherwise fallback to code
        const codeToSerialize = this._codeContent || this.code || '';
        return {
            ...base,
            type: this.type,
            code: codeToSerialize,
            language: this.language
        };
    }
    deserialize(values) {
        super.deserialize(values);
        if (values.code) {
            this._codeContent = values.code;
            this.code = values.code;
        }
        // Set language with Python default
        this.language = values.language || 'python';
    }
}
UMLStateCodeBlock.supportedRelationships = [StateRelationshipType.StateTransition];
UMLStateCodeBlock.features = { ...UMLElement.features, resizable: true };
//# sourceMappingURL=uml-state-code-block.js.map