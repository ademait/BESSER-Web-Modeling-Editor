import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import styled from 'styled-components';
import { Button } from '../../../components/controls/button/button';
import { ColorButton } from '../../../components/controls/color-button/color-button';
import { Divider } from '../../../components/controls/divider/divider';
import { TrashIcon } from '../../../components/controls/icon/trash';
import { Header } from '../../../components/controls/typography/typography';
import { localized } from '../../../components/i18n/localized';
import { StylePane } from '../../../components/style-pane/style-pane';
import { UMLElementRepository } from '../../../services/uml-element/uml-element-repository';
const Flex = styled.div `
  display: flex;
  align-items: baseline;
  justify-content: space-between;
`;
const StyledTextArea = styled.textarea `
  padding: 8px;
  border: 1px solid ${(props) => props.theme.color.gray};
  border-radius: 4px;
  width: 100%;
  max-width: 100%;
  min-height: 150px;
  font-family: monospace;

  white-space: pre;
  tab-size: 4;
  box-sizing: border-box;
  overflow-x: auto;
  
  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.color.primary};
  }
`;
class StateCodeBlockUpdate extends Component {
    constructor() {
        super(...arguments);
        this.state = { colorOpen: false };
        this.toggleColor = () => {
            this.setState((state) => ({
                colorOpen: !state.colorOpen,
            }));
        };
        this.updateCode = (event) => {
            const content = event.target.value;
            const { element, update } = this.props;
            update(element.id, {
                code: content
            });
        };
        this.handleKeyDown = (event) => {
            // Allow tab key to insert a tab character instead of changing focus
            if (event.key === 'Tab') {
                event.preventDefault();
                const target = event.target;
                const start = target.selectionStart;
                const end = target.selectionEnd;
                const value = target.value;
                const newValue = value.substring(0, start) + '\t' + value.substring(end);
                // Update the value directly
                target.value = newValue;
                // Update the cursor position
                setTimeout(() => {
                    target.selectionStart = target.selectionEnd = start + 1;
                }, 0);
                // Trigger the update with the new value
                this.updateCode({
                    target: target,
                    currentTarget: target,
                });
            }
        };
        this.onUpdateSize = (dimension) => (event) => {
            const value = parseInt(event.target.value, 10);
            if (!isNaN(value)) {
                const { element, update } = this.props;
                update(element.id, {
                    bounds: {
                        ...element.bounds,
                        [dimension]: value
                    }
                });
            }
        };
    }
    render() {
        const { element, update, deleteElement } = this.props;
        return (React.createElement("div", null,
            React.createElement("section", null,
                React.createElement(Flex, null,
                    React.createElement(Header, null, "Python Code Block"),
                    React.createElement(ColorButton, { onClick: this.toggleColor }),
                    React.createElement(Button, { color: "link", tabIndex: -1, onClick: () => deleteElement(element.id) },
                        React.createElement(TrashIcon, null))),
                React.createElement(StylePane, { open: this.state.colorOpen, element: element, onColorChange: update, fillColor: true, lineColor: true, textColor: true }),
                React.createElement(Divider, null)),
            React.createElement("section", null,
                React.createElement(StyledTextArea, { value: element.code || '', onChange: this.updateCode, onKeyDown: this.handleKeyDown, autoFocus: true, spellCheck: false }))));
    }
}
const enhance = compose(localized, connect(null, {
    update: UMLElementRepository.update,
    deleteElement: UMLElementRepository.delete,
}));
export const UMLStateCodeBlockUpdate = enhance(StateCodeBlockUpdate);
//# sourceMappingURL=uml-state-code-block-update.js.map