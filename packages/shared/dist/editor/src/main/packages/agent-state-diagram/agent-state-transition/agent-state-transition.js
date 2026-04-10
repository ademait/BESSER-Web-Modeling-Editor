import { AgentRelationshipType } from '..';
import { UMLRelationshipCenteredDescription } from '../../../services/uml-relationship/uml-relationship-centered-description';
export class AgentStateTransition extends UMLRelationshipCenteredDescription {
    constructor(values) {
        super(values);
        this.type = AgentRelationshipType.AgentStateTransition;
        this.params = {};
        this.condition = "when_intent_matched";
        this.intentName = undefined;
        this.variable = undefined;
        this.operator = undefined;
        this.targetValue = undefined;
        this.fileType = undefined;
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
        if (values?.condition) {
            this.condition = values.condition;
        }
        if (values?.intentName) {
            this.intentName = values.intentName;
        }
        if (values?.variable) {
            this.variable = values.variable;
        }
        if (values?.operator) {
            this.operator = values.operator;
        }
        if (values?.targetValue) {
            this.targetValue = values.targetValue;
        }
        if (values?.fileType) {
            this.fileType = values.fileType;
        }
    }
    serialize() {
        const base = super.serialize();
        const paramValues = Object.values(this.params);
        let conditionValue = "";
        if (this.condition == "when_intent_matched" && this.intentName) {
            conditionValue = this.intentName;
        }
        else if (this.condition == "when_no_intent_matched" || this.condition == "auto") {
            conditionValue = "";
        }
        else if (this.condition == "when_variable_operation_matched" && this.variable && this.operator && this.targetValue) {
            conditionValue = { "variable": this.variable, "operator": this.operator, "targetValue": this.targetValue };
        }
        else if (this.condition == "when_file_received" && this.fileType) {
            conditionValue = this.fileType;
        }
        return {
            ...base,
            type: this.type,
            condition: this.condition,
            conditionValue: conditionValue,
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
        if (values.condition == "when_intent_matched") {
            this.condition = values.condition;
            this.intentName = values.conditionValue;
        }
        else if (values.condition == "when_no_intent_matched" || values.condition == "auto") {
            this.condition = values.condition;
        }
        else if (values.condition == "when_variable_operation_matched") {
            this.condition = values.condition;
            if (typeof values.conditionValue === 'object') {
                this.variable = values.conditionValue.variable;
                this.operator = values.conditionValue.operator;
                this.targetValue = values.conditionValue.targetValue;
            }
        }
        else if (values.condition == "when_file_received") {
            this.condition = values.condition;
            this.fileType = values.conditionValue;
        }
    }
}
//# sourceMappingURL=agent-state-transition.js.map