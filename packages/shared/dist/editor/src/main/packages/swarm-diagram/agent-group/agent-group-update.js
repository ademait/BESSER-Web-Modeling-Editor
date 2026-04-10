import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { Textfield } from '../../../components/controls/textfield/textfield';
import { Dropdown } from '../../../components/controls/dropdown/dropdown'; // For enums
import { Button } from '../../../components/controls/button/button';
import { TrashIcon } from '../../../components/controls/icon/trash';
import { Divider } from '../../../components/controls/divider/divider';
import { styled } from '../../../components/theme/styles';
import { UMLElementRepository } from '../../../services/uml-element/uml-element-repository';
const Flex = styled.div `
  display: flex;
  align-items: baseline;
  justify-content: space-between;
`;
const enhance = compose(connect(null, {
    update: UMLElementRepository.update,
    delete: UMLElementRepository.delete,
}));
class AgentGroupUpdateComponent extends Component {
    constructor() {
        super(...arguments);
        this.rename = (id) => (value) => {
            this.props.update(id, { name: value });
        };
        this.changeFramework = (id) => (value) => {
            const updateData = { framework: value };
            this.props.update(id, updateData);
        };
        this.changeNumAgents = (id) => (value) => {
            const updateData = { numAgents: parseInt(value, 10) || 1 };
            this.props.update(id, updateData);
        };
        this.changePersona = (id) => (value) => {
            const updateData = { persona: value };
            this.props.update(id, updateData);
        };
        this.changeRole = (id) => (value) => {
            const updateData = { role: value };
            this.props.update(id, updateData);
        };
        this.delete = (id) => () => {
            this.props.delete(id);
        };
    }
    render() {
        const { element } = this.props;
        return (React.createElement("div", null,
            React.createElement("section", null,
                React.createElement(Flex, null,
                    React.createElement(Textfield, { value: element.name, onChange: this.rename(element.id), autoFocus: true }),
                    React.createElement(Button, { color: "link", tabIndex: -1, onClick: this.delete(element.id) },
                        React.createElement(TrashIcon, null))),
                React.createElement(Divider, null)),
            React.createElement("section", null,
                React.createElement(Dropdown, { value: element.framework, onChange: this.changeFramework(element.id) },
                    React.createElement(Dropdown.Item, { value: "BESSER-BAF" }, "BESSER-BAF"))),
            React.createElement("section", null,
                React.createElement(Textfield, { value: String(element.numAgents), onChange: this.changeNumAgents(element.id), type: "number", placeholder: "Number of Agents", min: "1" })),
            React.createElement("section", null,
                React.createElement(Textfield, { value: element.persona, onChange: this.changePersona(element.id), placeholder: "Persona" })),
            React.createElement("section", null,
                React.createElement(Textfield, { value: element.role, onChange: this.changeRole(element.id), placeholder: "Role" }))));
    }
}
export const AgentGroupUpdate = enhance(AgentGroupUpdateComponent);
//# sourceMappingURL=agent-group-update.js.map