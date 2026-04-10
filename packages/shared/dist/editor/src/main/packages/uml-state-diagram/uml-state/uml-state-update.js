import React, { Component, createRef } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import styled from 'styled-components';
import { Button } from '../../../components/controls/button/button';
import { ColorButton } from '../../../components/controls/color-button/color-button';
import { Divider } from '../../../components/controls/divider/divider';
import { TrashIcon } from '../../../components/controls/icon/trash';
import { Textfield } from '../../../components/controls/textfield/textfield';
import { Header } from '../../../components/controls/typography/typography';
import { localized } from '../../../components/i18n/localized';
import { StylePane } from '../../../components/style-pane/style-pane';
import { UMLElementRepository } from '../../../services/uml-element/uml-element-repository';
import { notEmpty } from '../../../utils/not-empty';
import { UMLStateBody } from '../uml-state-body/uml-state-body';
import { UMLStateFallbackBody } from '../uml-state-fallback_body/uml-state-fallback_body';
import UmlBodyUpdate from '../uml-state-body/uml-state-body-update';
const Flex = styled.div `
  display: flex;
  align-items: baseline;
  justify-content: space-between;
`;
const getInitialState = () => ({
    colorOpen: false,
});
const enhance = compose(localized, connect(null, {
    create: UMLElementRepository.create,
    update: UMLElementRepository.update,
    delete: UMLElementRepository.delete,
    getById: UMLElementRepository.getById,
}));
class StateUpdate extends Component {
    constructor() {
        super(...arguments);
        this.state = getInitialState();
        this.newFallbackBodyField = createRef();
        this.newBodyField = createRef();
        this.toggleColor = () => {
            this.setState((state) => ({
                colorOpen: !state.colorOpen,
            }));
        };
        this.create = (Clazz) => (value) => {
            const { element, create } = this.props;
            const member = new Clazz();
            member.name = value;
            create(member, element.id);
        };
        this.rename = (id) => (value) => {
            this.props.update(id, { name: value });
        };
        this.delete = (id) => () => {
            this.props.delete(id);
        };
    }
    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.state.fieldToFocus) {
            this.state.fieldToFocus.focus();
            this.setState({ fieldToFocus: undefined });
        }
    }
    render() {
        const { element, getById } = this.props;
        const children = element.ownedElements.map((id) => getById(id)).filter(notEmpty);
        const bodies = children.filter((child) => child instanceof UMLStateBody);
        const fallbackBodies = children.filter((child) => child instanceof UMLStateFallbackBody);
        const bodyRefs = [];
        const fallbackBodyRefs = [];
        return (React.createElement("div", null,
            React.createElement("section", null,
                React.createElement(Flex, null,
                    React.createElement(Textfield, { value: element.name, onChange: this.rename(element.id), autoFocus: true }),
                    React.createElement(ColorButton, { onClick: this.toggleColor }),
                    React.createElement(Button, { color: "link", tabIndex: -1, onClick: this.delete(element.id) },
                        React.createElement(TrashIcon, null))),
                React.createElement(StylePane, { open: this.state.colorOpen, element: element, onColorChange: this.props.update, fillColor: true, lineColor: true, textColor: true }),
                React.createElement(Divider, null)),
            React.createElement("section", null,
                React.createElement(Header, null, this.props.translate('popup.bodies')),
                bodies.map((body, index) => (React.createElement(UmlBodyUpdate, { id: body.id, key: body.id, value: body.name, onChange: this.props.update, onSubmitKeyUp: () => index === bodies.length - 1
                        ? this.newBodyField.current?.focus()
                        : this.setState({
                            fieldToFocus: bodyRefs[index + 1],
                        }), onDelete: this.delete, onRefChange: (ref) => (bodyRefs[index] = ref), element: body }))),
                React.createElement(Textfield, { ref: this.newBodyField, outline: true, value: "", onSubmit: this.create(UMLStateBody), onSubmitKeyUp: (key, value) => {
                        if (value) {
                            this.setState({
                                fieldToFocus: this.newBodyField.current,
                            });
                        }
                        else {
                            if (fallbackBodyRefs && fallbackBodyRefs.length > 0) {
                                this.setState({
                                    fieldToFocus: fallbackBodyRefs[0],
                                });
                            }
                            else {
                                this.setState({
                                    fieldToFocus: this.newFallbackBodyField.current,
                                });
                            }
                        }
                    }, onKeyDown: (event) => {
                        if (event.key === 'Tab' && event.currentTarget.value) {
                            event.preventDefault();
                            event.currentTarget.blur();
                            this.setState({
                                fieldToFocus: this.newBodyField.current,
                            });
                        }
                    } })),
            React.createElement("section", null,
                React.createElement(Divider, null),
                React.createElement(Header, null, this.props.translate('popup.fallback_bodies')),
                fallbackBodies.map((fallbackBody, index) => (React.createElement(UmlBodyUpdate, { id: fallbackBody.id, key: fallbackBody.id, value: fallbackBody.name, onChange: this.props.update, onSubmitKeyUp: () => index === fallbackBodies.length - 1
                        ? this.newFallbackBodyField.current?.focus()
                        : this.setState({
                            fieldToFocus: fallbackBodyRefs[index + 1],
                        }), onDelete: this.delete, onRefChange: (ref) => (fallbackBodyRefs[index] = ref), element: fallbackBody }))),
                React.createElement(Textfield, { ref: this.newFallbackBodyField, outline: true, value: "", onSubmit: this.create(UMLStateFallbackBody), onSubmitKeyUp: () => this.setState({
                        fieldToFocus: this.newFallbackBodyField.current,
                    }), onKeyDown: (event) => {
                        if (event.key === 'Tab' && event.currentTarget.value) {
                            event.preventDefault();
                            event.currentTarget.blur();
                            this.setState({
                                fieldToFocus: this.newFallbackBodyField.current,
                            });
                        }
                    } }))));
    }
}
export const UMLStateUpdate = enhance(StateUpdate);
//# sourceMappingURL=uml-state-update.js.map