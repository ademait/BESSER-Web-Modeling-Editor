import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { UMLElementRepository } from '../../services/uml-element/uml-element-repository';
import { withCanvas } from '../canvas/with-canvas';
import { localized } from '../i18n/localized';
import { Textfield } from '../controls/textfield/textfield';
import { ColorSelector } from './color-selector';
import { Color, Container, Divider, Row, FieldRow } from './style-pane-styles';
const getInitialState = () => ({
    fillSelectOpen: false,
    strokeSelectOpen: false,
    textSelectOpen: false,
});
const enhance = compose(localized, withCanvas, connect((state) => ({
    type: state.diagram.type,
    selected: state.selected,
    elements: state.elements,
}), {
    updateStart: UMLElementRepository.updateStart,
    update: UMLElementRepository.update,
    updateEnd: UMLElementRepository.updateEnd,
}));
class StylePaneComponent extends Component {
    constructor() {
        super(...arguments);
        this.state = getInitialState();
        this.handleFillColorChange = (color) => {
            const { element, onColorChange } = this.props;
            onColorChange(element.id, { fillColor: color });
        };
        this.handleLineColorChange = (color) => {
            const { element, onColorChange } = this.props;
            onColorChange(element.id, { strokeColor: color });
        };
        this.handleTextColorChange = (color) => {
            const { element, onColorChange } = this.props;
            onColorChange(element.id, { textColor: color });
        };
        this.handleDescriptionChange = (description) => {
            const { element, onFieldChange } = this.props;
            if (onFieldChange) {
                onFieldChange(element.id, { description });
            }
        };
        this.handleUriChange = (uri) => {
            const { element, onFieldChange } = this.props;
            if (onFieldChange) {
                onFieldChange(element.id, { uri });
            }
        };
        this.handleIconChange = (icon) => {
            const { element, onFieldChange } = this.props;
            if (onFieldChange) {
                onFieldChange(element.id, { icon });
            }
        };
        this.toggleFillSelect = () => {
            this.setState((prevState) => ({
                fillSelectOpen: !prevState.fillSelectOpen,
                strokeSelectOpen: false,
                textSelectOpen: false,
            }));
        };
        this.toggleLineSelect = () => {
            this.setState((prevState) => ({
                strokeSelectOpen: !prevState.strokeSelectOpen,
                fillSelectOpen: false,
                textSelectOpen: false,
            }));
        };
        this.toggleTextSelect = () => {
            this.setState((prevState) => ({
                textSelectOpen: !prevState.textSelectOpen,
                strokeSelectOpen: false,
                fillSelectOpen: false,
            }));
        };
    }
    render() {
        const { fillSelectOpen, strokeSelectOpen, textSelectOpen } = this.state;
        const { open, element, fillColor, lineColor, textColor, showDescription, showUri, showIcon } = this.props;
        const noneOpen = !fillSelectOpen && !strokeSelectOpen && !textSelectOpen;
        if (!open)
            return null;
        return (React.createElement(Container, null,
            showDescription && (React.createElement(React.Fragment, null,
                React.createElement(FieldRow, null,
                    React.createElement("label", null, "Description"),
                    React.createElement(Textfield, { value: element?.description || '', onChange: this.handleDescriptionChange, placeholder: "Enter description...", size: "sm" })),
                React.createElement(Divider, null))),
            showUri && (React.createElement(React.Fragment, null,
                React.createElement(FieldRow, null,
                    React.createElement("label", null, "URI"),
                    React.createElement(Textfield, { value: element?.uri || '', onChange: this.handleUriChange, placeholder: "Enter URI...", size: "sm" })),
                React.createElement(Divider, null))),
            showIcon && (React.createElement(React.Fragment, null,
                React.createElement(FieldRow, null,
                    React.createElement("label", null, "Icon"),
                    React.createElement(Textfield, { value: element?.icon || '', onChange: this.handleIconChange, placeholder: "Enter icon name...", size: "sm" })),
                React.createElement(Divider, null))),
            React.createElement(ColorRow, { title: "Fill Color", condition: fillColor && (fillSelectOpen || noneOpen), color: element?.fillColor, open: fillSelectOpen, onToggle: this.toggleFillSelect, onColorChange: this.handleFillColorChange, noDivider: !textColor && !lineColor }),
            React.createElement(ColorRow, { title: "Line Color", condition: lineColor && (strokeSelectOpen || noneOpen), color: element?.strokeColor, open: strokeSelectOpen, onToggle: this.toggleLineSelect, onColorChange: this.handleLineColorChange, noDivider: !textColor }),
            React.createElement(ColorRow, { title: "Text Color", condition: textColor && (textSelectOpen || noneOpen), color: element?.textColor, open: textSelectOpen, onToggle: this.toggleTextSelect, onColorChange: this.handleTextColorChange, noDivider: true })));
    }
}
const ColorRow = ({ condition, title, open, onToggle, onColorChange, color, noDivider }) => {
    if (!condition)
        return null;
    return (React.createElement(React.Fragment, null,
        React.createElement(Row, null,
            React.createElement("span", null, title),
            React.createElement(Color, { color: color, selected: open, onClick: onToggle })),
        React.createElement(ColorSelector, { open: open, color: color, onColorChange: onColorChange, key: title }),
        !open && !noDivider ? React.createElement(Divider, null) : null));
};
export const StylePane = enhance(StylePaneComponent);
//# sourceMappingURL=style-pane.js.map