import React, { Component, createRef } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import styled from 'styled-components';
import { Button } from '../../../components/controls/button/button';
import { ColorButton } from '../../../components/controls/color-button/color-button';
import { Divider } from '../../../components/controls/divider/divider';
import { TrashIcon } from '../../../components/controls/icon/trash';
import { Textfield } from '../../../components/controls/textfield/textfield';
import { localized } from '../../../components/i18n/localized';
import { StylePane } from '../../../components/style-pane/style-pane';
import { UMLElementRepository } from '../../../services/uml-element/uml-element-repository';
import { notEmpty } from '../../../utils/not-empty';
import { AgentStateBody } from '../agent-state-body/agent-state-body';
import { AgentStateFallbackBody } from '../agent-state-fallback-body/agent-state-fallback-body';
import BotBodyUpdate from '../agent-state-body/agent-state-body-update';
// import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// import { dark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Controlled as CodeMirror } from 'react-codemirror2';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material.css';
import 'codemirror/mode/python/python';
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
const ResizableCodeMirrorWrapper = styled.div `
  resize: both;
  overflow: auto; /* Ensure content doesn't overflow */
  min-height: 150px; /* Set a minimum height */
  border: 1px solid ${(props) => props.theme.color.gray};
  border-radius: 4px;
  padding: 8px;
  box-sizing: border-box;

  .CodeMirror {
    height: 100% !important; /* Ensure CodeMirror fills the wrapper */
    width: 100%;
  }
`;
const getInitialState = () => ({
    colorOpen: false,
});
const enhance = compose(localized, connect(null, {
    create: UMLElementRepository.create,
    update: UMLElementRepository.update,
    remove: UMLElementRepository.delete, // Updated to match the renamed property
    getById: UMLElementRepository.getById,
}));
class StateUpdate extends Component {
    constructor() {
        super(...arguments);
        this.state = getInitialState();
        this.newFallbackBodyField = createRef();
        this.newBodyField = createRef();
        this.actionTypeRef = createRef();
        this.bodyReplyType = "text";
        this.fallbackBodyReplyType = "text";
        this.toggleColor = () => {
            this.setState((state) => ({
                colorOpen: !state.colorOpen,
            }));
        };
        this.handleKeyDown = (event, bodyId) => {
            // Allow tab key to insert a tab character instead of changing focus
            if (event.key === 'Tab') {
                event.preventDefault();
                const target = event.target;
                const start = target.selectionStart;
                const end = target.selectionEnd;
                const value = target.value;
                const newValue = value.substring(0, start) + '\t' + value.substring(end);
                // Update the value directly in the textarea
                target.value = newValue;
                // Update the cursor position
                setTimeout(() => {
                    target.selectionStart = target.selectionEnd = start + 1;
                }, 0);
                // Propagate the change to the backend
                this.props.update(bodyId, { name: newValue });
            }
        };
        this.create = (Clazz, replyType) => (value) => {
            const { element, create } = this.props;
            const member = new Clazz();
            member.name = value;
            member.replyType = replyType;
            create(member, element.id);
        };
        this.rename = (id) => (value) => {
            this.props.update(id, { name: value });
        };
        this.delete = (id) => () => {
            this.props.remove(id); // Updated to use the renamed method
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
        const bodies = children.filter((child) => child instanceof AgentStateBody);
        const preserveTabs = (str) => {
            return str.replace(/\t/g, '    ');
        };
        bodies.forEach((body) => {
            if (body.replyType === "llm") {
                this.bodyReplyType = "llm";
            }
            else if (body.replyType === "code") {
                this.bodyReplyType = "code";
            }
            else {
                this.bodyReplyType = "text";
            }
        });
        const fallbackBodies = children.filter((child) => child instanceof AgentStateFallbackBody);
        fallbackBodies.forEach((fallbackBody) => {
            if (fallbackBody.replyType === "llm") {
                this.fallbackBodyReplyType = "llm";
            }
            else if (fallbackBody.replyType === "code") {
                this.fallbackBodyReplyType = "code";
            }
            else {
                this.fallbackBodyReplyType = "text";
            }
        });
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
                "Bot Action",
                React.createElement("div", null,
                    React.createElement("label", null,
                        React.createElement("input", { type: "radio", name: "actionType", value: "textReply", defaultChecked: this.bodyReplyType === "text", onChange: () => {
                                this.bodyReplyType = "text";
                                {
                                    bodies.forEach((body) => {
                                        if (body.replyType === "llm" || body.replyType === "code") {
                                            this.delete(body.id)();
                                        }
                                    });
                                }
                                this.forceUpdate();
                            } }),
                        "Text Reply"),
                    React.createElement("label", null,
                        React.createElement("input", { type: "radio", name: "actionType", value: "LLM", defaultChecked: this.bodyReplyType === "llm", onChange: () => {
                                this.bodyReplyType = "llm";
                                {
                                    bodies.forEach((body) => {
                                        if (body.replyType === "code" || body.replyType === "text") {
                                            this.delete(body.id)();
                                        }
                                    });
                                }
                                this.create(AgentStateBody, "llm")("AI response 🪄");
                                this.forceUpdate();
                            } }),
                        "LLM automatic reply"),
                    React.createElement("label", null,
                        React.createElement("input", { type: "radio", name: "actionType", value: "pythonCode", defaultChecked: this.bodyReplyType === "code", onChange: () => {
                                this.bodyReplyType = "code";
                                {
                                    bodies.forEach((body) => {
                                        if (body.replyType === "llm" || body.replyType === "text") {
                                            this.delete(body.id)();
                                        }
                                    });
                                }
                                this.create(AgentStateBody, "code")("def action_name(session: AgentSession):\n\n\n\n\n");
                                this.forceUpdate();
                            } }),
                        "Python Code")),
                this.bodyReplyType === "text" ? (React.createElement(React.Fragment, null,
                    bodies
                        .filter((body) => body.replyType === "text")
                        .map((body, index) => (React.createElement(BotBodyUpdate, { id: body.id, key: body.id, value: body.name, onChange: this.props.update, onSubmitKeyUp: () => index === bodies.length - 1
                            ? this.newBodyField.current?.focus()
                            : this.setState({
                                fieldToFocus: bodyRefs[index + 1],
                            }), onDelete: this.delete, onRefChange: (ref) => (bodyRefs[index] = ref), element: body }))),
                    React.createElement(Textfield, { ref: this.newBodyField, outline: true, value: "", onSubmit: this.create(AgentStateBody, "text"), onSubmitKeyUp: (key, value) => {
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
                        } }))) : this.bodyReplyType === "code" ? (React.createElement(React.Fragment, null,
                    React.createElement(ResizableCodeMirrorWrapper, null,
                        React.createElement(CodeMirror, { value: bodies.find((body) => body.replyType === "code").name, options: {
                                mode: 'python', // Enable Python syntax highlighting
                                theme: 'material', // Use the Material theme
                                lineNumbers: true, // Show line numbers
                                tabSize: 4,
                                indentWithTabs: true,
                            }, onBeforeChange: (editor, data, value) => {
                                const body = bodies.find((body) => body.replyType === "code");
                                this.props.update(body.id, { name: value }); // Update the backend with the new value
                            }, onChange: (editor, data, value) => {
                                const body = bodies.find((body) => body.replyType === "code");
                                if (value.trim()) {
                                    this.props.update(body.id, { name: value });
                                }
                                else {
                                }
                            } })))) : (React.createElement(React.Fragment, null,
                    React.createElement(React.Fragment, null,
                        React.createElement("p", null, "An automated response will be generated."))))),
            React.createElement("section", null,
                React.createElement(Divider, null)),
            React.createElement("section", null,
                "Bot Fallback Action",
                React.createElement("div", null,
                    React.createElement("label", null,
                        React.createElement("input", { type: "radio", name: "fallbackActionType", value: "textReply", defaultChecked: this.fallbackBodyReplyType === "text", onChange: () => {
                                this.fallbackBodyReplyType = "text";
                                {
                                    fallbackBodies.forEach((fallbackBody) => {
                                        if (fallbackBody.replyType === "llm") {
                                            this.delete(fallbackBody.id)();
                                        }
                                    });
                                }
                                this.forceUpdate();
                            } }),
                        "Text Reply"),
                    React.createElement("label", null,
                        React.createElement("input", { type: "radio", name: "fallbackActionType", value: "pythonCode", defaultChecked: this.fallbackBodyReplyType === "llm", onChange: () => {
                                this.fallbackBodyReplyType = "llm";
                                {
                                    fallbackBodies.forEach((body) => {
                                        if (body.replyType === "code" || body.replyType === "text") {
                                            this.delete(body.id)();
                                        }
                                    });
                                }
                                this.create(AgentStateFallbackBody, "llm")("AI response 🪄");
                                this.forceUpdate();
                            } }),
                        "LLM automatic reply"),
                    React.createElement("label", null,
                        React.createElement("input", { type: "radio", name: "fallbackActionType", value: "pythonCode", defaultChecked: this.fallbackBodyReplyType === "code", onChange: () => {
                                this.fallbackBodyReplyType = "code";
                                {
                                    fallbackBodies.forEach((fallbackBody) => {
                                        if (fallbackBody.replyType === "llm" || fallbackBody.replyType === "text") {
                                            this.delete(fallbackBody.id)();
                                        }
                                    });
                                }
                                this.create(AgentStateFallbackBody, "code")("def action_name(session: AgentSession):\n");
                                this.forceUpdate();
                            } }),
                        "Python Code")),
                this.fallbackBodyReplyType === "text" ? (React.createElement(React.Fragment, null,
                    fallbackBodies
                        .filter((fallbackBody) => fallbackBody.replyType === "text")
                        .map((fallbackBody, index) => (React.createElement(BotBodyUpdate, { id: fallbackBody.id, key: fallbackBody.id, value: fallbackBody.name, onChange: this.props.update, onSubmitKeyUp: () => index === fallbackBodies.length - 1
                            ? this.newFallbackBodyField.current?.focus()
                            : this.setState({
                                fieldToFocus: fallbackBodyRefs[index + 1],
                            }), onDelete: this.delete, onRefChange: (ref) => (fallbackBodyRefs[index] = ref), element: fallbackBody }))),
                    React.createElement(Textfield, { ref: this.newFallbackBodyField, outline: true, value: "", onSubmit: this.create(AgentStateFallbackBody, "text"), onSubmitKeyUp: () => this.setState({
                            fieldToFocus: this.newFallbackBodyField.current,
                        }), onKeyDown: (event) => {
                            if (event.key === 'Tab' && event.currentTarget.value) {
                                event.preventDefault();
                                event.currentTarget.blur();
                                this.setState({
                                    fieldToFocus: this.newFallbackBodyField.current,
                                });
                            }
                        } }))) : this.fallbackBodyReplyType === "code" ? (React.createElement(React.Fragment, null,
                    React.createElement(ResizableCodeMirrorWrapper, null,
                        React.createElement(CodeMirror, { value: fallbackBodies.find((fallbackBody) => fallbackBody.replyType === "code").name, options: {
                                mode: 'python', // Enable Python syntax highlighting
                                theme: 'material', // Use the Material theme
                                lineNumbers: true, // Show line numbers
                                tabSize: 4,
                                indentWithTabs: true,
                            }, onBeforeChange: (editor, data, value) => {
                                const fallbackBody = fallbackBodies.find((fallbackBody) => fallbackBody.replyType === "code");
                                this.props.update(fallbackBody.id, { name: value }); // Update the backend with the new value
                            }, onChange: (editor, data, value) => {
                                const fallbackBody = fallbackBodies.find((fallbackBody) => fallbackBody.replyType === "code");
                                if (value.trim()) {
                                    this.props.update(fallbackBody.id, { name: value });
                                }
                                else {
                                }
                            } })))) : (React.createElement(React.Fragment, null)))));
    }
}
export const AgentStateUpdate = enhance(StateUpdate);
//# sourceMappingURL=agent-state-update.js.map