import { StateRelationshipType } from '..';
import { UMLRelationshipCenteredDescription } from '../../../services/uml-relationship/uml-relationship-centered-description';
export class UMLStateTransition extends UMLRelationshipCenteredDescription {
    constructor(values) {
        super(values);
        this.type = StateRelationshipType.StateTransition;
        this.params = {};
        this.params = {};
        if (values?.params) {
            if (typeof values.params === 'string') {
                this.params = { '0': values.params };
            }
            else if (Array.isArray(values.params)) {
                values.params.forEach((param, index) => {
                    this.params[index.toString()] = param;
                });
            }
            else {
                this.params = values.params;
            }
        }
    }
    serialize() {
        const base = super.serialize();
        const paramValues = Object.values(this.params);
        return {
            ...base,
            type: this.type,
            params: paramValues.length === 0 ? undefined :
                paramValues.length === 1 ? paramValues[0] :
                    paramValues
        };
    }
    deserialize(values, children) {
        super.deserialize(values, children);
        this.params = {};
        if (values.params) {
            if (typeof values.params === 'string') {
                this.params = { '0': values.params };
            }
            else if (Array.isArray(values.params)) {
                values.params.forEach((param, index) => {
                    this.params[index.toString()] = param;
                });
            }
            else {
                this.params = values.params;
            }
        }
    }
}
//# sourceMappingURL=uml-state-transition.js.map