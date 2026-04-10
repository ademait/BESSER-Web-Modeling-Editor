import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import styled from 'styled-components';
import { Button } from '../../../components/controls/button/button';
import { Divider } from '../../../components/controls/divider/divider';
import { ExchangeIcon } from '../../../components/controls/icon/exchange';
import { TrashIcon } from '../../../components/controls/icon/trash';
import { Textfield } from '../../../components/controls/textfield/textfield';
import { Header } from '../../../components/controls/typography/typography';
import { localized } from '../../../components/i18n/localized';
import { UMLElementRepository } from '../../../services/uml-element/uml-element-repository';
import { UMLRelationshipRepository } from '../../../services/uml-relationship/uml-relationship-repository';
import { ColorButton } from '../../../components/controls/color-button/color-button';
import { StylePane } from '../../../components/style-pane/style-pane';
import { Dropdown } from '../../../components/controls/dropdown/dropdown';
const Flex = styled.div `
  display: flex;
  align-items: baseline;
  justify-content: space-between;
`;
const ParamContainer = styled.div `
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
`;
const ParamControls = styled.div `
  display: flex;
  gap: 4px;
`;
class AgentStateTransitionUpdateClass extends Component {
    constructor(props) {
        super(props);
        this.toggleColor = () => {
            this.setState((state) => ({
                colorOpen: !state.colorOpen,
            }));
        };
        this.rename = (name) => {
            this.props.update(this.props.element.id, { name });
        };
        this.state = {
            colorOpen: false,
            paramIds: Object.keys(props.element.params).length > 0
                ? Object.keys(props.element.params).sort()
                : ['0']
        };
    }
    render() {
        const { element, elements } = this.props;
        // Get intent names from current model state instead of localStorage
        const intentNames = Object.values(elements)
            .filter((el) => el.type === "AgentIntent" && typeof el.name === "string")
            .map((el) => el.name);
        return (React.createElement("div", null,
            React.createElement("section", null,
                React.createElement(Flex, null,
                    React.createElement(Header, { gutter: false, style: { flexGrow: 1 } }, this.props.translate('packages.AgentDiagram.StateTransition')),
                    React.createElement(ColorButton, { onClick: this.toggleColor }),
                    React.createElement(Button, { color: "link", onClick: () => this.props.flip(element.id) },
                        React.createElement(ExchangeIcon, null)),
                    React.createElement(Button, { color: "link", onClick: () => this.props.delete(element.id) },
                        React.createElement(TrashIcon, null))),
                React.createElement(Divider, null)),
            React.createElement("section", null),
            React.createElement("section", null,
                React.createElement(Header, null, "Condition"),
                React.createElement(Dropdown, { value: element.condition || 'when_intent_matched', onChange: value => this.props.update(element.id, { condition: value }) },
                    React.createElement(Dropdown.Item, { value: "when_intent_matched" }, "When Intent Matched"),
                    React.createElement(Dropdown.Item, { value: "when_no_intent_matched" }, "When No Intent Matched"),
                    React.createElement(Dropdown.Item, { value: "when_variable_operation_matched" }, "Variable Operation Matched"),
                    React.createElement(Dropdown.Item, { value: "when_file_received" }, "File Received"),
                    React.createElement(Dropdown.Item, { value: "auto" }, "Auto Transition")),
                element.condition === "when_intent_matched" && (React.createElement(Dropdown, { value: element.intentName || '__placeholder__', onChange: value => this.props.update(element.id, { intentName: value === '__placeholder__' ? '' : value }) }, [
                    React.createElement(Dropdown.Item, { value: "__placeholder__", key: "intent-placeholder" }, "Select intent"),
                    ...intentNames.map((name, idx) => (React.createElement(Dropdown.Item, { key: idx, value: name }, name)))
                ])),
                element.condition === "when_variable_operation_matched" && (React.createElement(React.Fragment, null,
                    React.createElement(Textfield, { value: element.variable || "", onChange: value => this.props.update(element.id, { variable: value }), placeholder: "Variable", style: { marginBottom: "8px" } }),
                    React.createElement(Dropdown, { value: element.operator || '==', onChange: value => this.props.update(element.id, { operator: value }) },
                        React.createElement(Dropdown.Item, { value: "<" }, "<"),
                        React.createElement(Dropdown.Item, { value: "<=" }, "\u2264"),
                        React.createElement(Dropdown.Item, { value: "==" }, "=="),
                        React.createElement(Dropdown.Item, { value: ">=" }, "\u2265"),
                        React.createElement(Dropdown.Item, { value: ">" }, ">"),
                        React.createElement(Dropdown.Item, { value: "!=" }, "!=")),
                    React.createElement(Textfield, { value: element.targetValue || "", onChange: value => this.props.update(element.id, { targetValue: value }), placeholder: "Target value" }))),
                element.condition === "when_file_received" && (React.createElement(Dropdown, { value: element.fileType || '__placeholder__', onChange: value => this.props.update(element.id, { fileType: value === '__placeholder__' ? '' : value }) }, [
                    React.createElement(Dropdown.Item, { value: "__placeholder__", key: "filetype-placeholder" }, "Select file type"),
                    React.createElement(Dropdown.Item, { value: "PDF", key: "pdf" }, "PDF"),
                    React.createElement(Dropdown.Item, { value: "TXT", key: "txt" }, "TXT"),
                    React.createElement(Dropdown.Item, { value: "JSON", key: "json" }, "JSON")
                ]))),
            React.createElement(StylePane, { open: this.state.colorOpen, element: element, onColorChange: this.props.update, lineColor: true, textColor: true })));
    }
}
const enhance = compose(localized, connect((state) => ({
    elements: state.elements,
}), {
    update: UMLElementRepository.update,
    delete: UMLElementRepository.delete,
    flip: UMLRelationshipRepository.flip,
}));
export const AgentStateTransitionUpdate = enhance(AgentStateTransitionUpdateClass);
//# sourceMappingURL=agent-state-transition-update.js.map