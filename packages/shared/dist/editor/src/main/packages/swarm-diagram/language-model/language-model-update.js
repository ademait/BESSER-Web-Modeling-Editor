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
class LanguageModelUpdateComponent extends Component {
    constructor() {
        super(...arguments);
        this.rename = (id) => (value) => {
            this.props.update(id, { name: value });
        };
        this.changeProvider = (id) => (value) => {
            const updateData = { provider: value };
            this.props.update(id, updateData);
        };
        this.changeModel = (id) => (value) => {
            const updateData = { model: value };
            this.props.update(id, updateData);
        };
        this.changeEndpoint = (id) => (value) => {
            const updateData = { endpoint: value };
            this.props.update(id, updateData);
        };
        this.changeTemperature = (id) => (value) => {
            const updateData = { temperature: parseFloat(value) || 0.7 };
            this.props.update(id, updateData);
        };
        this.changeMaxTokens = (id) => (value) => {
            const updateData = { maxTokens: parseInt(value, 10) || 4096 };
            this.props.update(id, updateData);
        };
        this.changeApiKeySecret = (id) => (value) => {
            const updateData = { apiKeySecret: value };
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
                React.createElement(Dropdown, { value: element.provider, onChange: this.changeProvider(element.id) },
                    React.createElement(Dropdown.Item, { value: "OPENAI" }, "OpenAI"),
                    React.createElement(Dropdown.Item, { value: "GOOGLE" }, "Google"),
                    React.createElement(Dropdown.Item, { value: "ANTHROPIC" }, "Anthropic"),
                    React.createElement(Dropdown.Item, { value: "OLLAMA" }, "Ollama"),
                    React.createElement(Dropdown.Item, { value: "CUSTOM" }, "Custom"))),
            React.createElement("section", null,
                React.createElement(Textfield, { value: element.model, onChange: this.changeModel(element.id), placeholder: "Model (e.g., gpt-4)" })),
            React.createElement("section", null,
                React.createElement(Textfield, { value: element.endpoint, onChange: this.changeEndpoint(element.id), placeholder: "Endpoint URL" })),
            React.createElement("section", null,
                React.createElement(Textfield, { value: String(element.temperature), onChange: this.changeTemperature(element.id), type: "number", placeholder: "Temperature (0.0 - 1.0)", step: "0.1", min: "0", max: "1" })),
            React.createElement("section", null,
                React.createElement(Textfield, { value: String(element.maxTokens), onChange: this.changeMaxTokens(element.id), type: "number", placeholder: "Max Tokens", step: "1", min: "1" })),
            React.createElement("section", null,
                React.createElement(Textfield, { value: element.apiKeySecret, onChange: this.changeApiKeySecret(element.id), placeholder: "API Key Secret" }))));
    }
}
export const LanguageModelUpdate = enhance(LanguageModelUpdateComponent);
//# sourceMappingURL=language-model-update.js.map