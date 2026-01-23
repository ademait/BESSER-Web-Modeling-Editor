import React, { Component, ComponentClass } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { Textfield } from '../../../components/controls/textfield/textfield';
import { Dropdown } from '../../../components/controls/dropdown/dropdown'; // For enums
import { Button } from '../../../components/controls/button/button';
import { TrashIcon } from '../../../components/controls/icon/trash';
import { Divider } from '../../../components/controls/divider/divider';
import { styled } from '../../../components/theme/styles';
import { UMLElementRepository } from '../../../services/uml-element/uml-element-repository';
import { LanguageModel } from './language-model';
import { ModelState } from '../../../components/store/model-state';

const Flex = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
`;

interface OwnProps {
  element: LanguageModel;
}

type StateProps = {};

interface DispatchProps {
  update: typeof UMLElementRepository.update;
  delete: typeof UMLElementRepository.delete;
}

type Props = OwnProps & StateProps & DispatchProps;

const enhance = compose<ComponentClass<OwnProps>>(
  connect<StateProps, DispatchProps, OwnProps, ModelState>(null, {
    update: UMLElementRepository.update,
    delete: UMLElementRepository.delete,
  }),
);

class LanguageModelUpdateComponent extends Component<Props> {
  private rename = (id: string) => (value: string) => {
    this.props.update(id, { name: value });
  };

  private changeProvider = (id: string) => (value: string) => {
    const updateData: any = { provider: value };
    this.props.update(id, updateData);
  };

  private changeModel = (id: string) => (value: string) => {
    const updateData: any = { model: value };
    this.props.update(id, updateData);
  };

  private changeEndpoint = (id: string) => (value: string) => {
    const updateData: any = { endpoint: value };
    this.props.update(id, updateData);
  };

  private changeTemperature = (id: string) => (value: string) => {
    const updateData: any = { temperature: parseFloat(value) || 0.7 };
    this.props.update(id, updateData);
  };

  private changeMaxTokens = (id: string) => (value: string) => {
    const updateData: any = { maxTokens: parseInt(value, 10) || 4096 };
    this.props.update(id, updateData);
  };

  private changeApiKeySecret = (id: string) => (value: string) => {
    const updateData: any = { apiKeySecret: value };
    this.props.update(id, updateData);
  };

  private delete = (id: string) => () => {
    this.props.delete(id);
  };
  
  render() {
    const { element } = this.props;
    return (
      <div>
        <section>
          <Flex>
            <Textfield value={element.name} onChange={this.rename(element.id)} autoFocus />
            <Button color="link" tabIndex={-1} onClick={this.delete(element.id)}>
              <TrashIcon />
            </Button>
          </Flex>
          <Divider />
        </section>
        <section>
          <Dropdown value={element.provider} onChange={this.changeProvider(element.id)}>
            <Dropdown.Item value="OPENAI">OpenAI</Dropdown.Item>
            <Dropdown.Item value="GOOGLE">Google</Dropdown.Item>
            <Dropdown.Item value="ANTHROPIC">Anthropic</Dropdown.Item>
            <Dropdown.Item value="OLLAMA">Ollama</Dropdown.Item>
            <Dropdown.Item value="CUSTOM">Custom</Dropdown.Item>
          </Dropdown>
        </section>
        <section>
          <Textfield
            value={element.model}
            onChange={this.changeModel(element.id)}
            placeholder="Model (e.g., gpt-4)"
          />
        </section>
        <section>
          <Textfield
            value={element.endpoint}
            onChange={this.changeEndpoint(element.id)}
            placeholder="Endpoint URL"
          />
        </section>
        <section>
          <Textfield
            value={String(element.temperature)}
            onChange={this.changeTemperature(element.id)}
            type="number"
            placeholder="Temperature (0.0 - 1.0)"
            step="0.1"
            min="0"
            max="1"
          />
        </section>
        <section>
          <Textfield
            value={String(element.maxTokens)}
            onChange={this.changeMaxTokens(element.id)}
            type="number"
            placeholder="Max Tokens"
            step="1"
            min="1"
          />
        </section>
        <section>
          <Textfield
            value={element.apiKeySecret}
            onChange={this.changeApiKeySecret(element.id)}
            placeholder="API Key Secret"
          />
        </section>
      </div>
    );
  }
}

export const LanguageModelUpdate = enhance(LanguageModelUpdateComponent);