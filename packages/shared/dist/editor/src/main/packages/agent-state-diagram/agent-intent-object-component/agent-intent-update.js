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
import { AgentIntentBody } from '../agent-intent-body/agent-intent-body';
import AgentIntentUpdate from '../agent-intent-body/agent-intent-body-update';
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
        const bodies = children.filter((child) => child instanceof AgentIntentBody);
        const bodyRefs = [];
        return (React.createElement("div", null,
            React.createElement("section", null,
                "Intent Name",
                React.createElement(Flex, null,
                    React.createElement(Textfield, { value: element.name, onChange: this.rename(element.id), autoFocus: true }),
                    React.createElement(ColorButton, { onClick: this.toggleColor }),
                    React.createElement(Button, { color: "link", tabIndex: -1, onClick: this.delete(element.id) },
                        React.createElement(TrashIcon, null))),
                React.createElement(StylePane, { open: this.state.colorOpen, element: element, onColorChange: this.props.update, fillColor: true, lineColor: true, textColor: true }),
                React.createElement(Divider, null)),
            React.createElement("section", null,
                "Training Sentences",
                React.createElement(Header, null, this.props.translate('popup.bodies')),
                bodies.map((body, index) => (React.createElement(AgentIntentUpdate, { id: body.id, key: body.id, value: body.name, onChange: this.props.update, onSubmitKeyUp: () => index === bodies.length - 1
                        ? this.newBodyField.current?.focus()
                        : this.setState({
                            fieldToFocus: bodyRefs[index + 1],
                        }), onDelete: this.delete, onRefChange: (ref) => (bodyRefs[index] = ref), element: body }))),
                React.createElement(Textfield, { ref: this.newBodyField, outline: true, value: "", onSubmit: this.create(AgentIntentBody), onSubmitKeyUp: (key, value) => {
                        if (value) {
                            this.setState({
                                fieldToFocus: this.newBodyField.current,
                            });
                        }
                        else {
                        }
                    }, onKeyDown: (event) => {
                        if (event.key === 'Tab' && event.currentTarget.value) {
                            event.preventDefault();
                            event.currentTarget.blur();
                            this.setState({
                                fieldToFocus: this.newBodyField.current,
                            });
                        }
                    } }))));
    }
}
export const AgentIntentBodyUpdate = enhance(StateUpdate);
//# sourceMappingURL=agent-intent-update.js.map