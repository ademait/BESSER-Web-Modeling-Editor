import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Button } from '../../../components/controls/button/button';
import { ColorButton } from '../../../components/controls/color-button/color-button';
import { TrashIcon } from '../../../components/controls/icon/trash';
import { Textfield } from '../../../components/controls/textfield/textfield';
import { StylePane } from '../../../components/style-pane/style-pane';
import { styled } from '../../../components/theme/styles';
import { UMLElementRepository } from '../../../services/uml-element/uml-element-repository';
import { StereotypeToggle } from '../../../components/controls/stereotype-toggle/stereotype-toggle';
const Flex = styled.div `
  display: flex;
  align-items: baseline;
  justify-content: space-between;
`;
class ComponentSubsystemUpdate extends Component {
    constructor() {
        super(...arguments);
        this.state = { colorOpen: false };
        this.toggleColor = () => {
            this.setState((state) => ({
                colorOpen: !state.colorOpen,
            }));
        };
        this.onRename = (value) => {
            const { element, update } = this.props;
            update(element.id, { name: value });
        };
        this.onStereotypeVisibilityToggle = () => {
            const { element, update } = this.props;
            const newVisibilityValue = !element.displayStereotype;
            update(element.id, { displayStereotype: newVisibilityValue });
        };
    }
    render() {
        const { element } = this.props;
        return (React.createElement("div", null,
            React.createElement("section", null,
                React.createElement(Flex, null,
                    React.createElement(Textfield, { value: element.name, onChange: this.onRename, autoFocus: true }),
                    React.createElement(ColorButton, { onClick: this.toggleColor }),
                    React.createElement(StereotypeToggle, { value: element.displayStereotype, onChange: this.onStereotypeVisibilityToggle }),
                    React.createElement(Button, { color: "link", tabIndex: -1, onClick: () => this.props.delete(element.id) },
                        React.createElement(TrashIcon, null)))),
            React.createElement(StylePane, { open: this.state.colorOpen, element: element, onColorChange: this.props.update, lineColor: true, textColor: true, fillColor: true })));
    }
}
const enhance = connect(null, {
    update: UMLElementRepository.update,
    delete: UMLElementRepository.delete,
});
export const UMLComponentSubsystemUpdate = enhance(ComponentSubsystemUpdate);
//# sourceMappingURL=uml-component-subsystem-update.js.map