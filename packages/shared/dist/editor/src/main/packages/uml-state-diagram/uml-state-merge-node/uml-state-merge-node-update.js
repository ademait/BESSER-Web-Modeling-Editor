import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { Button } from '../../../components/controls/button/button';
import { ColorButton } from '../../../components/controls/color-button/color-button';
import { Divider } from '../../../components/controls/divider/divider';
import { ArrowRightIcon } from '../../../components/controls/icon/arrow-right';
import { Textfield } from '../../../components/controls/textfield/textfield';
import { Body, Header } from '../../../components/controls/typography/typography';
import { localized } from '../../../components/i18n/localized';
import { StylePane } from '../../../components/style-pane/style-pane';
import { styled } from '../../../components/theme/styles';
import { UMLElementRepository } from '../../../services/uml-element/uml-element-repository';
import { UMLRelationship } from '../../../services/uml-relationship/uml-relationship';
const Flex = styled.div `
  display: flex;
  align-items: baseline;
  justify-content: space-between;
`;
const Controls = styled.div `
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;
const SizeInput = styled.input `
  padding: 4px 8px;
  border: 1px solid ${(props) => props.theme.color.gray};
  border-radius: 4px;
  width: 80px;
  
  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.color.primary};
  }
`;
class StateMergeNodeUpdate extends Component {
    constructor() {
        super(...arguments);
        this.state = { colorOpen: false };
        this.toggleColor = () => {
            this.setState((state) => ({
                colorOpen: !state.colorOpen,
            }));
        };
        this.onUpdate = (name) => {
            const { element, update } = this.props;
            update(element.id, { name });
        };
        this.onUpdateOption = (id) => (name) => {
            const { update } = this.props;
            update(id, { name });
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
        const { element, decisions, targets, update } = this.props;
        return (React.createElement("div", null,
            React.createElement("section", null,
                React.createElement(Flex, null,
                    React.createElement(Textfield, { value: element.name, onChange: this.onUpdate }),
                    React.createElement(ColorButton, { onClick: this.toggleColor })),
                React.createElement(StylePane, { open: this.state.colorOpen, element: element, onColorChange: update, fillColor: true, lineColor: true, textColor: true }),
                React.createElement(Controls, null,
                    React.createElement("div", null,
                        React.createElement("span", null, this.props.translate('common.width')),
                        React.createElement(SizeInput, { type: "number", value: element.bounds.width, onChange: this.onUpdateSize('width'), min: 50, max: 1000 })),
                    React.createElement("div", null,
                        React.createElement("span", null, this.props.translate('common.height')),
                        React.createElement(SizeInput, { type: "number", value: element.bounds.height, onChange: this.onUpdateSize('height'), min: 50, max: 1000 })))),
            React.createElement("section", null, decisions.length > 0 && (React.createElement(React.Fragment, null,
                React.createElement(Divider, null),
                React.createElement(Header, null, this.props.translate('popup.condition')),
                decisions.map((decision, i) => (React.createElement(Flex, { key: decision.id },
                    React.createElement(Textfield, { gutter: i < decisions.length - 1, value: decision.name, onChange: this.onUpdateOption(decision.id) }),
                    React.createElement(Button, { color: "link", disabled: true },
                        React.createElement(ArrowRightIcon, null)),
                    React.createElement(Body, null, targets[i].name)))))))));
    }
}
const enhance = compose(localized, connect((state, props) => {
    const decisions = Object.values(state.elements)
        .filter((x) => UMLRelationship.isUMLRelationship(x))
        .filter((x) => x.source.element === props.element.id);
    return {
        decisions,
        targets: decisions.map((relationship) => state.elements[relationship.target.element]),
    };
}, {
    update: UMLElementRepository.update,
    getById: UMLElementRepository.getById,
}));
export const UMLStateMergeNodeUpdate = enhance(StateMergeNodeUpdate);
//# sourceMappingURL=uml-state-merge-node-update.js.map