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
class StateTransitionUpdate extends Component {
    constructor(props) {
        super(props);
        this.toggleColor = () => {
            this.setState((state) => ({
                colorOpen: !state.colorOpen,
            }));
        };
        this.addParam = () => {
            const newId = (Math.max(...this.state.paramIds.map(Number)) + 1).toString();
            this.setState(prevState => ({ paramIds: [...prevState.paramIds, newId] }), () => {
                const newParams = { ...this.props.element.params, [newId]: '' };
                this.props.update(this.props.element.id, { params: newParams });
            });
        };
        this.removeParam = (id) => {
            this.setState(prevState => ({
                paramIds: prevState.paramIds.filter(paramId => paramId !== id)
            }), () => {
                const newParams = { ...this.props.element.params };
                delete newParams[id];
                this.props.update(this.props.element.id, { params: newParams });
            });
        };
        this.handleParamChange = (id, value) => {
            const newParams = { ...this.props.element.params, [id]: value };
            this.props.update(this.props.element.id, { params: newParams });
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
        const { element } = this.props;
        return (React.createElement("div", null,
            React.createElement("section", null,
                React.createElement(Flex, null,
                    React.createElement(Header, { gutter: false, style: { flexGrow: 1 } }, this.props.translate('packages.StateDiagram.StateTransition')),
                    React.createElement(ColorButton, { onClick: this.toggleColor }),
                    React.createElement(Button, { color: "link", onClick: () => this.props.flip(element.id) },
                        React.createElement(ExchangeIcon, null)),
                    React.createElement(Button, { color: "link", onClick: () => this.props.delete(element.id) },
                        React.createElement(TrashIcon, null))),
                React.createElement(Divider, null)),
            React.createElement("section", null,
                React.createElement(Header, null, "Name"),
                React.createElement(Textfield, { value: element.name, onChange: this.rename, autoFocus: true })),
            React.createElement("section", null,
                React.createElement(Flex, null,
                    React.createElement(Header, null, "Parameters"),
                    React.createElement(Button, { color: "link", onClick: this.addParam }, "Add")),
                this.state.paramIds.map((id, index) => (React.createElement(ParamContainer, { key: index },
                    React.createElement(Textfield, { value: this.props.element.params[id], onChange: (value) => this.handleParamChange(id, value), placeholder: `Parameter ${index + 1}` }),
                    this.state.paramIds.length > 1 && (React.createElement(ParamControls, null,
                        React.createElement(Button, { color: "link", onClick: () => this.removeParam(id) },
                            React.createElement(TrashIcon, null)))))))),
            React.createElement(StylePane, { open: this.state.colorOpen, element: element, onColorChange: this.props.update, lineColor: true, textColor: true })));
    }
}
const enhance = compose(localized, connect(null, {
    update: UMLElementRepository.update,
    delete: UMLElementRepository.delete,
    flip: UMLRelationshipRepository.flip,
}));
export const UMLStateTransitionUpdate = enhance(StateTransitionUpdate);
//# sourceMappingURL=uml-state-transition-update.js.map